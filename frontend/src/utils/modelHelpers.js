import { getColumnIndex } from './dataHelpers';

/* ── Data splitting ── */
export function trainTestSplit(columns, rows, features, target, ratio, seed = 42) {
  const tIdx = getColumnIndex(columns, target);
  const fIdxs = features.map(f => getColumnIndex(columns, f));
  // filter valid rows (no null in any used column)
  const valid = rows.filter(r => {
    if (r[tIdx] == null) return false;
    return fIdxs.every(i => r[i] != null && !isNaN(Number(r[i])));
  });
  // seeded shuffle
  const shuffled = [...valid];
  let s = seed;
  const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const splitAt = Math.floor(shuffled.length * (1 - ratio));
  const train = shuffled.slice(0, splitAt);
  const test = shuffled.slice(splitAt);
  const extract = (data) => ({
    X: data.map(r => fIdxs.map(i => Number(r[i]))),
    y: data.map(r => Number(r[tIdx])),
  });
  return { train: extract(train), test: extract(test), trainRaw: train, testRaw: test };
}

/* ── Simple OLS regression ── */
export function olsRegression(X, y) {
  const n = X.length, p = X[0].length;
  // Add intercept column
  const Xa = X.map(row => [1, ...row]);
  const cols = p + 1;
  // X^T X
  const XtX = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: cols }, (_, j) =>
      Xa.reduce((s, row) => s + row[i] * row[j], 0)
    )
  );
  // X^T y
  const Xty = Array.from({ length: cols }, (_, i) =>
    Xa.reduce((s, row, k) => s + row[i] * y[k], 0)
  );
  // Solve via Gaussian elimination
  const coef = solveLinear(XtX, Xty);
  return coef; // [intercept, b1, b2, ...]
}

function solveLinear(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let mx = Math.abs(M[i][i]), mxR = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > mx) { mx = Math.abs(M[k][i]); mxR = k; }
    [M[i], M[mxR]] = [M[mxR], M[i]];
    if (Math.abs(M[i][i]) < 1e-10) { M[i][i] = 1e-10; }
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i];
  }
  return x;
}

/* ── Prediction helpers ── */
export function predictOLS(X, coef) {
  return X.map(row => coef[0] + row.reduce((s, v, i) => s + v * coef[i + 1], 0));
}

/* ── Regression metrics ── */
export function regressionMetrics(yTrue, yPred) {
  const n = yTrue.length;
  const mean = yTrue.reduce((a, b) => a + b, 0) / n;
  const ssTot = yTrue.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = yTrue.reduce((s, v, i) => s + (v - yPred[i]) ** 2, 0);
  const r2 = 1 - ssRes / (ssTot || 1);
  const mse = ssRes / n;
  const rmse = Math.sqrt(mse);
  const mae = yTrue.reduce((s, v, i) => s + Math.abs(v - yPred[i]), 0) / n;
  return { r2, mse, rmse, mae, n };
}

/* ── Classification metrics ── */
export function classificationMetrics(yTrue, yPred, labels) {
  const n = yTrue.length;
  const acc = yTrue.filter((v, i) => v === yPred[i]).length / n;
  // Binary case
  const uniqueLabels = labels || [...new Set([...yTrue, ...yPred])].sort((a, b) => a - b);
  const cm = uniqueLabels.map(actual =>
    uniqueLabels.map(pred => yTrue.filter((v, i) => v === actual && yPred[i] === pred).length)
  );
  // For binary: precision, recall, f1
  let precision = acc, recall = acc, f1 = acc;
  if (uniqueLabels.length === 2) {
    const tp = cm[1][1], fp = cm[0][1], fn = cm[1][0];
    precision = tp / (tp + fp || 1);
    recall = tp / (tp + fn || 1);
    f1 = 2 * precision * recall / (precision + recall || 1);
  }
  return { accuracy: acc, precision, recall, f1, confusionMatrix: cm, labels: uniqueLabels };
}

/* ── Simple K-Means ── */
export function kMeans(X, k, maxIter = 100, seed = 42) {
  const n = X.length, d = X[0].length;
  let s = seed;
  const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  // Init centroids randomly
  const indices = [];
  while (indices.length < k) { const idx = Math.floor(rng() * n); if (!indices.includes(idx)) indices.push(idx); }
  let centroids = indices.map(i => [...X[i]]);
  let labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newLabels = X.map(pt => {
      let minD = Infinity, minC = 0;
      centroids.forEach((c, ci) => {
        const dist = c.reduce((s, v, j) => s + (v - pt[j]) ** 2, 0);
        if (dist < minD) { minD = dist; minC = ci; }
      });
      return minC;
    });
    // Update
    const newCentroids = centroids.map((_, ci) => {
      const pts = X.filter((_, i) => newLabels[i] === ci);
      if (!pts.length) return centroids[ci];
      return Array.from({ length: d }, (_, j) => pts.reduce((s, p) => s + p[j], 0) / pts.length);
    });
    const converged = newLabels.every((l, i) => l === labels[i]);
    labels = newLabels;
    centroids = newCentroids;
    if (converged) break;
  }
  // Inertia
  const inertia = X.reduce((s, pt, i) =>
    s + centroids[labels[i]].reduce((ss, v, j) => ss + (v - pt[j]) ** 2, 0), 0);
  return { labels, centroids, inertia };
}

/* ── Silhouette score (simplified) ── */
export function silhouetteScore(X, labels, k) {
  const n = X.length;
  if (n < 2) return 0;
  const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  let totalS = 0;
  const sample = n > 200 ? 200 : n; // limit for performance
  for (let i = 0; i < sample; i++) {
    const ci = labels[i];
    const clusterPts = X.filter((_, j) => labels[j] === ci && j !== i);
    const a = clusterPts.length ? clusterPts.reduce((s, p) => s + dist(X[i], p), 0) / clusterPts.length : 0;
    let minB = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ci) continue;
      const otherPts = X.filter((_, j) => labels[j] === c);
      if (!otherPts.length) continue;
      const avgD = otherPts.reduce((s, p) => s + dist(X[i], p), 0) / otherPts.length;
      if (avgD < minB) minB = avgD;
    }
    if (minB === Infinity) minB = 0;
    totalS += (minB - a) / (Math.max(a, minB) || 1);
  }
  return totalS / sample;
}

/* ── Simple PCA ── */
export function simplePCA(X, nComponents = 2) {
  const n = X.length, d = X[0].length;
  // Mean center + standardize
  const means = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j], 0) / n);
  const stds = Array.from({ length: d }, (_, j) => {
    const m = means[j];
    const variance = X.reduce((s, r) => s + (r[j] - m) ** 2, 0) / n;
    return Math.sqrt(variance) || 1;
  });
  const Xc = X.map(r => r.map((v, j) => (v - means[j]) / stds[j]));
  // Covariance matrix
  const cov = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) =>
      Xc.reduce((s, r) => s + r[i] * r[j], 0) / (n - 1)
    )
  );
  // Power iteration for eigenvalues (simplified)
  const eigens = [];
  const covCopy = cov.map(r => [...r]);
  for (let comp = 0; comp < Math.min(nComponents, d); comp++) {
    let vec = Array.from({ length: d }, () => Math.random());
    let norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    vec = vec.map(v => v / norm);
    for (let iter = 0; iter < 100; iter++) {
      const newVec = vec.map((_, i) => covCopy[i].reduce((s, v, j) => s + v * vec[j], 0));
      norm = Math.sqrt(newVec.reduce((s, v) => s + v * v, 0)) || 1;
      const normalized = newVec.map(v => v / norm);
      const diff = normalized.reduce((s, v, i) => s + (v - vec[i]) ** 2, 0);
      vec = normalized;
      if (diff < 1e-10) break;
    }
    const eigenvalue = vec.reduce((s, v, i) => s + v * covCopy[i].reduce((ss, cv, j) => ss + cv * vec[j], 0), 0);
    eigens.push({ value: eigenvalue, vector: vec });
    // Deflate
    for (let i = 0; i < d; i++)
      for (let j = 0; j < d; j++)
        covCopy[i][j] -= eigenvalue * vec[i] * vec[j];
  }
  const totalVar = cov.reduce((s, r, i) => s + r[i], 0);
  const explainedRatio = eigens.map(e => e.value / (totalVar || 1));
  const transformed = Xc.map(r => eigens.map(e => e.vector.reduce((s, v, j) => s + v * r[j], 0)));
  const loadings = eigens.map(e => e.vector);
  return { transformed, explainedRatio, loadings, eigenvalues: eigens.map(e => e.value), featureNames: null };
}

/* ── KNN ── */
export function knnPredict(XTrain, yTrain, XTest, k = 5, weights = 'uniform', taskType = 'classification') {
  const dist = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
  return XTest.map(pt => {
    const dists = XTrain.map((tr, i) => ({ d: dist(pt, tr), y: yTrain[i] }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    if (taskType === 'regression') {
      if (weights === 'distance') {
        const wSum = dists.reduce((s, d) => s + 1 / (d.d || 1e-10), 0);
        return dists.reduce((s, d) => s + d.y / (d.d || 1e-10), 0) / wSum;
      }
      return dists.reduce((s, d) => s + d.y, 0) / k;
    }
    // Classification: majority vote
    const votes = {};
    dists.forEach(d => {
      const w = weights === 'distance' ? 1 / (d.d || 1e-10) : 1;
      votes[d.y] = (votes[d.y] || 0) + w;
    });
    return Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]);
  });
}

/* ── Euclidean distance ── */
export function euclideanDist(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}
