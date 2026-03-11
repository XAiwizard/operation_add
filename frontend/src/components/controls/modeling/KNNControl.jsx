import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, classificationMetrics, regressionMetrics, knnPredict } from '../../../utils/modelHelpers';
import { drawConfusionMatrix, drawScatterPlot, drawLineChart } from '../../../utils/chartFunctions';

const TASK_TYPES = [
  { value: 'classification', label: '분류 (Classification)' },
  { value: 'regression', label: '회귀 (Regression)' },
];
const WEIGHT_OPTIONS = [
  { value: 'uniform', label: 'Uniform (동일 가중)' },
  { value: 'distance', label: 'Distance (거리 가중)' },
];
const DISTANCE_METRICS = [
  { value: 'euclidean', label: 'Euclidean' },
  { value: 'manhattan', label: 'Manhattan' },
  { value: 'minkowski', label: 'Minkowski' },
];

export default function KNNControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [taskType, setTaskType] = useState('classification');
  const [kValue, setKValue] = useState(5);
  const [weights, setWeights] = useState('uniform');
  const [metric, setMetric] = useState('euclidean');
  const [pValue, setPValue] = useState(2);

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (!features.length) { addLog('[경고] 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < kValue) { addLog('[경고] K보다 학습 데이터가 적습니다.', 'warn'); return; }

      // Standardize
      const d = features.length;
      const means = Array.from({ length: d }, (_, j) => train.X.reduce((s, r) => s + r[j], 0) / train.X.length);
      const stds = Array.from({ length: d }, (_, j) => {
        const m = means[j]; return Math.sqrt(train.X.reduce((s, r) => s + (r[j] - m) ** 2, 0) / train.X.length) || 1;
      });
      const trainXs = train.X.map(r => r.map((v, j) => (v - means[j]) / stds[j]));
      const testXs = test.X.map(r => r.map((v, j) => (v - means[j]) / stds[j]));

      const yPredTest = knnPredict(trainXs, train.y, testXs, kValue, weights, taskType);
      const isCls = taskType === 'classification';

      let metricsHtml, mainMetric;

      if (isCls) {
        const uniqueLabels = [...new Set([...train.y, ...test.y])].sort((a, b) => a - b);
        const m = classificationMetrics(test.y, yPredTest, uniqueLabels);
        const yPredTrain = knnPredict(trainXs, train.y, trainXs, kValue, weights, taskType);
        const mTrain = classificationMetrics(train.y, yPredTrain, uniqueLabels);
        const badge = m.accuracy >= 0.8 ? 'bg' : m.accuracy >= 0.6 ? 'bw' : 'bb';
        mainMetric = `Acc=${m.accuracy.toFixed(4)}`;
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
          <tr><td>Accuracy</td><td>${mTrain.accuracy.toFixed(4)}</td><td>${m.accuracy.toFixed(4)} <span class="badge ${badge}">${m.accuracy >= 0.8 ? '우수' : m.accuracy >= 0.6 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>Precision</td><td>${mTrain.precision.toFixed(4)}</td><td>${m.precision.toFixed(4)}</td></tr>
          <tr><td>Recall</td><td>${mTrain.recall.toFixed(4)}</td><td>${m.recall.toFixed(4)}</td></tr>
          <tr><td>F1</td><td>${mTrain.f1.toFixed(4)}</td><td>${m.f1.toFixed(4)}</td></tr></table>`;
      } else {
        const m = regressionMetrics(test.y, yPredTest);
        const yPredTrain = knnPredict(trainXs, train.y, trainXs, kValue, weights, taskType);
        const mTrain = regressionMetrics(train.y, yPredTrain);
        const badge = m.r2 >= 0.7 ? 'bg' : m.r2 >= 0.4 ? 'bw' : 'bb';
        mainMetric = `R²=${m.r2.toFixed(4)}`;
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
          <tr><td>R²</td><td>${mTrain.r2.toFixed(4)}</td><td>${m.r2.toFixed(4)} <span class="badge ${badge}">${m.r2 >= 0.7 ? '우수' : m.r2 >= 0.4 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>MSE</td><td>${mTrain.mse.toFixed(2)}</td><td>${m.mse.toFixed(2)}</td></tr>
          <tr><td>RMSE</td><td>${mTrain.rmse.toFixed(2)}</td><td>${m.rmse.toFixed(2)}</td></tr>
          <tr><td>MAE</td><td>${mTrain.mae.toFixed(2)}</td><td>${m.mae.toFixed(2)}</td></tr></table>`;
      }

      // K optimization: test k=1..min(20, trainSize)
      const maxK = Math.min(20, trainXs.length);
      const kScores = [];
      for (let ek = 1; ek <= maxK; ek++) {
        const pred = knnPredict(trainXs, train.y, testXs, ek, weights, taskType);
        if (isCls) {
          const acc = test.y.filter((v, i) => v === pred[i]).length / test.y.length;
          kScores.push(parseFloat(acc.toFixed(4)));
        } else {
          const m = regressionMetrics(test.y, pred);
          kScores.push(parseFloat(m.r2.toFixed(4)));
        }
      }

      const html = `<h2>KNN 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  ${isCls ? '<button class="tbtn" onclick="showTab(this,\'tab2\')">혼동행렬</button>' : '<button class="tbtn" onclick="showTab(this,\'tab2\')">실제 vs 예측</button>'}
  <button class="tbtn" onclick="showTab(this,'tab3')">K 최적화</button>
</div>
<div id="tab1" class="tc active">
  ${metricsHtml}
  <p class="note">K: ${kValue}, Weight: ${weights}, Distance: ${metric}${metric === 'minkowski' ? `, p=${pValue}` : ''}</p>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvResult" width="700" height="420"></canvas></div></div>
<div id="tab3" class="tc">
  <p class="note">K=1~${maxK}에 대한 ${isCls ? 'Accuracy' : 'R²'} 변화</p>
  <div class="cw"><canvas id="cvKopt" width="750" height="400"></canvas></div>
</div>`;

      const popup = openPopup('KNN', html);
      if (popup) setTimeout(() => {
        try {
          const c2 = popup.document.getElementById('cvResult')?.getContext('2d');
          if (c2) {
            if (isCls) {
              const uniqueLabels = [...new Set([...test.y, ...yPredTest])].sort((a, b) => a - b);
              const cm = uniqueLabels.map(actual =>
                uniqueLabels.map(pred => test.y.filter((v, i) => v === actual && yPredTest[i] === pred).length)
              );
              drawConfusionMatrix(c2, cm, uniqueLabels.map(String));
            } else {
              drawScatterPlot(c2, test.y, yPredTest, { title: '실제 vs 예측', xLabel: '실제값', yLabel: '예측값', regressionLine: true });
            }
          }
          const c3 = popup.document.getElementById('cvKopt')?.getContext('2d');
          if (c3) drawLineChart(c3,
            Array.from({ length: maxK }, (_, i) => String(i + 1)),
            [{ label: isCls ? 'Accuracy' : 'R²', values: kScores }],
            { title: `K별 ${isCls ? 'Accuracy' : 'R²'} 변화`, markers: true, grid: true }
          );
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`KNN 완료 (K=${kValue}, ${mainMetric})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="KNN">
      <FormSelect label="작업 유형" value={taskType} onChange={setTaskType} options={TASK_TYPES} />
      <FormInput label="K (이웃 수)" tooltip="1~20" type="number" value={kValue} onChange={setKValue} />
      <FormSelect label="가중치" tooltip="이웃 투표시 가중 방식" value={weights} onChange={setWeights} options={WEIGHT_OPTIONS} />
      <FormSelect label="거리 함수" tooltip="거리 계산 방법" value={metric} onChange={setMetric} options={DISTANCE_METRICS} />
      {metric === 'minkowski' && <FormInput label="p (Minkowski)" tooltip="1: Manhattan, 2: Euclidean" type="number" value={pValue} onChange={setPValue} />}
    </ModelControlTemplate>
  );
}
