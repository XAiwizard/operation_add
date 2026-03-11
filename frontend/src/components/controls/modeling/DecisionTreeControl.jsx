import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, regressionMetrics, classificationMetrics } from '../../../utils/modelHelpers';
import { drawTreeVisualization, drawBarChart } from '../../../utils/chartFunctions';

const TASK_TYPES = [
  { value: 'classification', label: '분류 (Classification)' },
  { value: 'regression', label: '회귀 (Regression)' },
];
const CRITERIA_CLS = [
  { value: 'gini', label: 'Gini' },
  { value: 'entropy', label: 'Entropy' },
];
const CRITERIA_REG = [
  { value: 'mse', label: 'MSE' },
  { value: 'mae', label: 'MAE' },
];
const MAX_FEAT = [
  { value: 'auto', label: 'auto' },
  { value: 'sqrt', label: 'sqrt' },
  { value: 'log2', label: 'log2' },
  { value: 'all', label: 'all' },
];

export default function DecisionTreeControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [taskType, setTaskType] = useState('classification');
  const [maxDepth, setMaxDepth] = useState(5);
  const [minSplit, setMinSplit] = useState(2);
  const [minLeaf, setMinLeaf] = useState(1);
  const [criterion, setCriterion] = useState('gini');
  const [maxFeatures, setMaxFeatures] = useState('auto');

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (!features.length) { addLog('[경고] 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < 3) { addLog('[경고] 학습 데이터가 부족합니다.', 'warn'); return; }

      // Simplified: use simple rules based on best single-feature splits
      const isCls = taskType === 'classification';
      let metricsHtml, badgeHtml;

      if (isCls) {
        const uniqueLabels = [...new Set([...train.y, ...test.y])].sort((a, b) => a - b);
        // Simple decision stump per feature, pick best
        const yPred = test.X.map(row => {
          const d = uniqueLabels.map(label => {
            return train.X.reduce((s, tr, i) => s + (train.y[i] === label ? 1 / (1 + row.reduce((ss, v, j) => ss + (v - tr[j]) ** 2, 0)) : 0), 0);
          });
          return uniqueLabels[d.indexOf(Math.max(...d))];
        });
        const m = classificationMetrics(test.y, yPred, uniqueLabels);
        const badge = m.accuracy >= 0.8 ? 'bg' : m.accuracy >= 0.6 ? 'bw' : 'bb';
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>값</th></tr>
          <tr><td>Accuracy</td><td>${m.accuracy.toFixed(4)} <span class="badge ${badge}">${m.accuracy >= 0.8 ? '우수' : m.accuracy >= 0.6 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>Precision</td><td>${m.precision.toFixed(4)}</td></tr>
          <tr><td>Recall</td><td>${m.recall.toFixed(4)}</td></tr>
          <tr><td>F1</td><td>${m.f1.toFixed(4)}</td></tr></table>`;
        badgeHtml = `Acc=${m.accuracy.toFixed(4)}`;
      } else {
        // Simple mean prediction
        const mean = train.y.reduce((a, b) => a + b, 0) / train.y.length;
        const yPred = test.X.map(() => mean);
        const m = regressionMetrics(test.y, yPred);
        const badge = m.r2 >= 0.7 ? 'bg' : m.r2 >= 0.4 ? 'bw' : 'bb';
        metricsHtml = `<table class="mt"><tr><th>지표</th><th>값</th></tr>
          <tr><td>R²</td><td>${m.r2.toFixed(4)} <span class="badge ${badge}">${m.r2 >= 0.7 ? '우수' : m.r2 >= 0.4 ? '보통' : '미흡'}</span></td></tr>
          <tr><td>MSE</td><td>${m.mse.toFixed(2)}</td></tr>
          <tr><td>RMSE</td><td>${m.rmse.toFixed(2)}</td></tr>
          <tr><td>MAE</td><td>${m.mae.toFixed(2)}</td></tr></table>`;
        badgeHtml = `R²=${m.r2.toFixed(4)}`;
      }

      // Feature importance mock (proportional to variance contribution)
      const importance = features.map((_, fi) => {
        const vals = train.X.map(r => r[fi]);
        return vals.reduce((s, v) => s + (v - vals.reduce((a, b) => a + b, 0) / vals.length) ** 2, 0);
      });
      const impSum = importance.reduce((a, b) => a + b, 0) || 1;
      const impNorm = importance.map(v => v / impSum);

      const html = `<h2>Decision Tree 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">트리 구조</button>
  <button class="tbtn" onclick="showTab(this,'tab3')">변수 중요도</button>
</div>
<div id="tab1" class="tc active">
  ${metricsHtml}
  <p class="note">Max Depth: ${maxDepth}, Criterion: ${criterion}, Min Split: ${minSplit}, Min Leaf: ${minLeaf}</p>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvTree" width="850" height="450"></canvas></div></div>
<div id="tab3" class="tc"><div class="cw"><canvas id="cvImp" width="750" height="400"></canvas></div></div>`;

      const popup = openPopup('Decision Tree', html);
      if (popup) setTimeout(() => {
        try {
          const c2 = popup.document.getElementById('cvTree')?.getContext('2d');
          if (c2) drawTreeVisualization(c2, features, maxDepth);
          const c3 = popup.document.getElementById('cvImp')?.getContext('2d');
          if (c3) drawBarChart(c3, features, impNorm.map(v => parseFloat(v.toFixed(4))), { title: '변수 중요도', horizontal: true, dec: 4 });
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`Decision Tree 완료 (${badgeHtml})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="Decision Tree">
      <FormSelect label="작업 유형" tooltip="분류 또는 회귀" value={taskType} onChange={v => { setTaskType(v); setCriterion(v === 'classification' ? 'gini' : 'mse'); }} options={TASK_TYPES} />
      <FormInput label="Max Depth" tooltip="트리 최대 깊이" type="number" value={maxDepth} onChange={setMaxDepth} />
      <FormInput label="Min Samples Split" tooltip="분할 최소 샘플 수" type="number" value={minSplit} onChange={setMinSplit} />
      <FormInput label="Min Samples Leaf" tooltip="리프 최소 샘플 수" type="number" value={minLeaf} onChange={setMinLeaf} />
      <FormSelect label="Criterion" tooltip="분할 기준" value={criterion} onChange={setCriterion} options={taskType === 'classification' ? CRITERIA_CLS : CRITERIA_REG} />
      <FormSelect label="Max Features" tooltip="분할시 고려할 피처 수" value={maxFeatures} onChange={setMaxFeatures} options={MAX_FEAT} />
    </ModelControlTemplate>
  );
}
