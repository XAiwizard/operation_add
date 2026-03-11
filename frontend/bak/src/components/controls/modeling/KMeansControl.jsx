import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { getNumericColumns, getNumColValues } from '../../../utils/dataHelpers';
import { kMeans, silhouetteScore } from '../../../utils/modelHelpers';
import { drawScatterPlot, drawBarChart, drawLineChart } from '../../../utils/chartFunctions';
import { CC } from '../../../utils/chartFunctions';

const INIT_METHODS = [
  { value: 'kmeans++', label: 'K-means++' },
  { value: 'random', label: 'Random' },
];
const ALGORITHMS = [
  { value: 'lloyd', label: 'Lloyd' },
  { value: 'elkan', label: 'Elkan' },
];

export default function KMeansControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [features, setFeatures] = useState([]);
  const [k, setK] = useState(3);
  const [maxIter, setMaxIter] = useState(300);
  const [initMethod, setInitMethod] = useState('kmeans++');
  const [nInit, setNInit] = useState(10);
  const [algorithm, setAlgorithm] = useState('lloyd');

  const execute = () => {
    if (features.length < 2) { addLog('[경고] 2개 이상 피처를 선택하세요.', 'warn'); return; }
    try {
      const X = [];
      const validIdx = [];
      rows.forEach((row, ri) => {
        const vals = features.map(f => {
          const ci = columns.indexOf(f);
          return row[ci] != null ? Number(row[ci]) : NaN;
        });
        if (vals.every(v => !isNaN(v))) { X.push(vals); validIdx.push(ri); }
      });
      if (X.length < k) { addLog('[경고] 데이터가 부족합니다.', 'warn'); return; }

      // Standardize
      const d = X[0].length;
      const means = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j], 0) / X.length);
      const stds = Array.from({ length: d }, (_, j) => {
        const m = means[j]; return Math.sqrt(X.reduce((s, r) => s + (r[j] - m) ** 2, 0) / X.length) || 1;
      });
      const Xs = X.map(r => r.map((v, j) => (v - means[j]) / stds[j]));

      const result = kMeans(Xs, k, maxIter, 42);
      const sil = silhouetteScore(Xs, result.labels, k);

      // Elbow curve
      const elbowKs = [];
      const elbowInertias = [];
      for (let ek = 2; ek <= Math.min(10, X.length); ek++) {
        const r = kMeans(Xs, ek, 50, 42);
        elbowKs.push(ek);
        elbowInertias.push(parseFloat(r.inertia.toFixed(2)));
      }

      // Silhouette per cluster
      const clusterSils = Array.from({ length: k }, (_, c) => {
        const pts = Xs.filter((_, i) => result.labels[i] === c);
        if (pts.length < 2) return 0;
        return parseFloat(silhouetteScore(Xs, result.labels.filter((_, i) => result.labels[i] === c || true), k).toFixed(3));
      });

      // Cluster counts
      const clusterCounts = Array.from({ length: k }, (_, c) => result.labels.filter(l => l === c).length);
      const countRows = clusterCounts.map((cnt, c) => `<tr><td>군집 ${c}</td><td>${cnt}</td><td>${(cnt / X.length * 100).toFixed(1)}%</td></tr>`).join('');

      const html = `<h2>K-Means Clustering 결과 (K=${k})</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">군집 결과</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">실루엣</button>
  <button class="tbtn" onclick="showTab(this,'tab3')">Elbow</button>
</div>
<div id="tab1" class="tc active">
  <table class="mt"><tr><th>군집</th><th>데이터 수</th><th>비율</th></tr>${countRows}</table>
  <p class="note">실루엣 점수: ${sil.toFixed(4)} ${sil >= 0.5 ? '<span class="badge bg">우수</span>' : sil >= 0.25 ? '<span class="badge bw">보통</span>' : '<span class="badge bb">미흡</span>'}</p>
  <div class="cw"><canvas id="cvCluster" width="750" height="420"></canvas></div>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvSil" width="750" height="400"></canvas></div></div>
<div id="tab3" class="tc"><div class="cw"><canvas id="cvElbow" width="750" height="400"></canvas></div></div>`;

      const popup = openPopup('K-Means', html);
      if (popup) setTimeout(() => {
        try {
          const c1 = popup.document.getElementById('cvCluster')?.getContext('2d');
          if (c1) {
            const hueColors = result.labels.map(l => CC[l % CC.length]);
            drawScatterPlot(c1, Xs.map(r => r[0]), Xs.map(r => r[1] || 0), {
              title: `군집 산점도 (${features[0]} vs ${features[1] || features[0]})`,
              xLabel: features[0], yLabel: features[1] || features[0],
              hueColors, alpha: 0.7
            });
          }
          const c2 = popup.document.getElementById('cvSil')?.getContext('2d');
          if (c2) drawBarChart(c2, clusterCounts.map((_, i) => `군집 ${i}`), clusterSils, { title: '군집별 실루엣 점수', dec: 3 });
          const c3 = popup.document.getElementById('cvElbow')?.getContext('2d');
          if (c3) drawLineChart(c3, elbowKs.map(String), [{ label: 'Inertia', values: elbowInertias }], { title: 'Elbow Method', markers: true, grid: true });
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`K-Means 완료 (K=${k}, Silhouette=${sil.toFixed(4)})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <div>
      <InfoBox>K-Means 군집 분석을 수행합니다.</InfoBox>
      <div className="form-group">
        <label className="form-label">피처 선택 <Tooltip text="군집에 사용할 수치형 컬럼 (2개 이상)" /></label>
        <ColumnCheckboxList columns={numCols} name="km_feat" onChange={setFeatures} />
      </div>
      <FormInput label="군집 수 (K)" tooltip="2~20 사이 값" type="number" value={k} onChange={setK} />
      <FormInput label="최대 반복수" tooltip="수렴까지 최대 반복" type="number" value={maxIter} onChange={setMaxIter} />
      <FormSelect label="초기화 방법" tooltip="중심점 초기화 방식" value={initMethod} onChange={setInitMethod} options={INIT_METHODS} />
      <FormInput label="n_init" tooltip="초기화 반복 횟수" type="number" value={nInit} onChange={setNInit} />
      <FormSelect label="알고리즘" tooltip="K-means 알고리즘" value={algorithm} onChange={setAlgorithm} options={ALGORITHMS} />
      <ActionButton onClick={execute}>군집 분석 실행</ActionButton>
    </div>
  );
}
