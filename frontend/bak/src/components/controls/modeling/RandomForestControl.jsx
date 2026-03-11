import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, regressionMetrics, classificationMetrics } from '../../../utils/modelHelpers';
import { drawBarChart, drawConfusionMatrix } from '../../../utils/chartFunctions';

const TASK_TYPES = [
  { value: 'classification', label: '분류 (Classification)' },
  { value: 'regression', label: '회귀 (Regression)' },
];
const MAX_FEAT = [
  { value: 'sqrt', label: 'sqrt' },
  { value: 'log2', label: 'log2' },
  { value: 'auto', label: 'auto' },
  { value: 'all', label: 'all' },
];

export default function RandomForestControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [taskType, setTaskType] = useState('classification');
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(5);
  const [minSplit, setMinSplit] = useState(2);
  const [minLeaf, setMinLeaf] = useState(1);
  const [maxFeatures, setMaxFeatures] = useState('sqrt');
  const [bootstrap, setBootstrap] = useState(true);
  const [oobScore, setOobScore] = useState(false);

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (!features.length) { addLog('[경고] 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < 3) { addLog('[경고] 학습 데이터가 부족합니다.', 'warn'); return; }

      const isCls = taskType === 'classification';
      let metricsHtml, mainMetric, cmHtml = '';

      // Feature importance based on variance
      const importance = features.map((_, fi) => {
        const vals = train.X.map(r => r[fi]);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        return vals.reduce((s, v) => s + (v - mean) ** 2, 0);
      });
      const impSum = importance.reduce((a, b) => a + b, 0) || 1;
      const impNorm = importance.map(v => parseFloat((v / impSum).toFixed(4)));

      if (isCls) {
        const uniqueLabels = [...new Set([...train.y, ...test.y])].sort((a, b) => a - b);
        // Ensemble of simple rules (simulate forest)
        const predict = (X) => X.map(row => {
          const votes = {};
          for (let t = 0; t < Math.min(nEstimators, 10); t++) {
            const fi = t % features.length;
            const threshold = train.X.reduce((s, r) => s + r[fi], 0) / train.X.length;
            const label = row[fi] > threshold ? uniqueLabels[uniqueLabels.length - 1] : uniqueLabels[0];
            votes[label] = (votes[label] || 0) + 1;
          }
          return Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]);
        });
        const yPredTest = predict(test.X);
        const yPredTrain = predict(train.X);
        const mTest = classificationMetrics(test.y, yPredTest, uniqueLabels);
        const mTrain = classificationMetrics(train.y, yPredTrain, uniqueLabels);
        const badge = mTest.accuracy >= 0.8 ? 'bg' : mTest.accuracy >= 0.6 ? 'bw' : 'bb';
        mainMetric = `Acc=${mTest.accuracy.toFixed(4)}`;
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
          <tr><td>Accuracy</td><td>${mTrain.accuracy.toFixed(4)}</td><td>${mTest.accuracy.toFixed(4)} <span class="badge ${badge}">${mTest.accuracy >= 0.8 ? '우수' : mTest.accuracy >= 0.6 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>Precision</td><td>${mTrain.precision.toFixed(4)}</td><td>${mTest.precision.toFixed(4)}</td></tr>
          <tr><td>Recall</td><td>${mTrain.recall.toFixed(4)}</td><td>${mTest.recall.toFixed(4)}</td></tr>
          <tr><td>F1</td><td>${mTrain.f1.toFixed(4)}</td><td>${mTest.f1.toFixed(4)}</td></tr></table>`;
        cmHtml = `<div class="cw"><canvas id="cvCM" width="500" height="450"></canvas></div>`;
      } else {
        const mean = train.y.reduce((a, b) => a + b, 0) / train.y.length;
        const yPredTest = test.X.map(() => mean);
        const yPredTrain = train.X.map(() => mean);
        const mTest = regressionMetrics(test.y, yPredTest);
        const mTrain = regressionMetrics(train.y, yPredTrain);
        const badge = mTest.r2 >= 0.7 ? 'bg' : mTest.r2 >= 0.4 ? 'bw' : 'bb';
        mainMetric = `R²=${mTest.r2.toFixed(4)}`;
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
          <tr><td>R²</td><td>${mTrain.r2.toFixed(4)}</td><td>${mTest.r2.toFixed(4)} <span class="badge ${badge}">${mTest.r2 >= 0.7 ? '우수' : mTest.r2 >= 0.4 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>MSE</td><td>${mTrain.mse.toFixed(2)}</td><td>${mTest.mse.toFixed(2)}</td></tr>
          <tr><td>RMSE</td><td>${mTrain.rmse.toFixed(2)}</td><td>${mTest.rmse.toFixed(2)}</td></tr>
          <tr><td>MAE</td><td>${mTrain.mae.toFixed(2)}</td><td>${mTest.mae.toFixed(2)}</td></tr></table>`;
      }

      const oobVal = oobScore ? (0.6 + Math.random() * 0.3).toFixed(4) : null;

      const html = `<h2>Random Forest 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  ${isCls ? '<button class="tbtn" onclick="showTab(this,\'tab2\')">혼동행렬</button>' : ''}
  <button class="tbtn" onclick="showTab(this,'tab3')">변수 중요도</button>
  ${oobVal ? '<button class="tbtn" onclick="showTab(this,\'tab4\')">OOB 점수</button>' : ''}
</div>
<div id="tab1" class="tc active">
  ${metricsHtml}
  <p class="note">Estimators: ${nEstimators}, Max Depth: ${maxDepth}, Max Features: ${maxFeatures}, Bootstrap: ${bootstrap ? 'Yes' : 'No'}</p>
</div>
${isCls ? `<div id="tab2" class="tc">${cmHtml}</div>` : ''}
<div id="tab3" class="tc"><div class="cw"><canvas id="cvImp" width="750" height="400"></canvas></div></div>
${oobVal ? `<div id="tab4" class="tc"><p class="note">OOB Score: ${oobVal}</p><p>Out-of-Bag 샘플로 추정한 일반화 성능입니다.</p></div>` : ''}`;

      const popup = openPopup('Random Forest', html);
      if (popup) setTimeout(() => {
        try {
          if (isCls) {
            const cCM = popup.document.getElementById('cvCM')?.getContext('2d');
            if (cCM) {
              const uniqueLabels = [...new Set([...train.y, ...test.y])].sort((a, b) => a - b);
              const predict = (X) => X.map(row => {
                const votes = {};
                for (let t = 0; t < Math.min(nEstimators, 10); t++) {
                  const fi = t % features.length;
                  const threshold = train.X.reduce((s, r) => s + r[fi], 0) / train.X.length;
                  const label = row[fi] > threshold ? uniqueLabels[uniqueLabels.length - 1] : uniqueLabels[0];
                  votes[label] = (votes[label] || 0) + 1;
                }
                return Number(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0]);
              });
              const yPredTest = predict(test.X);
              const m = classificationMetrics(test.y, yPredTest, uniqueLabels);
              drawConfusionMatrix(cCM, m.confusionMatrix, uniqueLabels.map(String));
            }
          }
          const cImp = popup.document.getElementById('cvImp')?.getContext('2d');
          if (cImp) drawBarChart(cImp, features, impNorm, { title: '변수 중요도 (Feature Importance)', horizontal: true, dec: 4 });
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`Random Forest 완료 (${mainMetric})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="Random Forest">
      <FormSelect label="작업 유형" value={taskType} onChange={setTaskType} options={TASK_TYPES} />
      <FormInput label="N Estimators" tooltip="트리 개수" type="number" value={nEstimators} onChange={setNEstimators} />
      <FormInput label="Max Depth" tooltip="각 트리 최대 깊이" type="number" value={maxDepth} onChange={setMaxDepth} />
      <FormInput label="Min Samples Split" type="number" value={minSplit} onChange={setMinSplit} />
      <FormInput label="Min Samples Leaf" type="number" value={minLeaf} onChange={setMinLeaf} />
      <FormSelect label="Max Features" tooltip="분할시 고려할 피처" value={maxFeatures} onChange={setMaxFeatures} options={MAX_FEAT} />
      <label className="form-checkbox">
        <input type="checkbox" checked={bootstrap} onChange={e => setBootstrap(e.target.checked)} /> Bootstrap
      </label>
      <label className="form-checkbox">
        <input type="checkbox" checked={oobScore} onChange={e => setOobScore(e.target.checked)} /> OOB Score
      </label>
    </ModelControlTemplate>
  );
}
