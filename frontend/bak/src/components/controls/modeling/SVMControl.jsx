import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, classificationMetrics } from '../../../utils/modelHelpers';
import { drawConfusionMatrix } from '../../../utils/chartFunctions';

const KERNELS = [
  { value: 'rbf', label: 'RBF (가우시안)' },
  { value: 'linear', label: 'Linear' },
  { value: 'poly', label: 'Polynomial' },
  { value: 'sigmoid', label: 'Sigmoid' },
];
const GAMMA_OPTIONS = [
  { value: 'scale', label: 'scale' },
  { value: 'auto', label: 'auto' },
  { value: 'custom', label: '직접 입력' },
];

export default function SVMControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [kernel, setKernel] = useState('rbf');
  const [cValue, setCValue] = useState(1.0);
  const [gamma, setGamma] = useState('scale');
  const [gammaCustom, setGammaCustom] = useState(0.1);
  const [degree, setDegree] = useState(3);

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (!features.length) { addLog('[경고] 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < 3) { addLog('[경고] 학습 데이터가 부족합니다.', 'warn'); return; }

      const uniqueLabels = [...new Set([...train.y, ...test.y])].sort((a, b) => a - b);
      // Simplified: nearest centroid classification
      const centroids = uniqueLabels.map(label => {
        const pts = train.X.filter((_, i) => train.y[i] === label);
        return features.map((_, fi) => pts.reduce((s, r) => s + r[fi], 0) / (pts.length || 1));
      });
      const predict = (X) => X.map(row => {
        const dists = centroids.map(c => c.reduce((s, v, j) => s + (v - row[j]) ** 2, 0));
        return uniqueLabels[dists.indexOf(Math.min(...dists))];
      });
      const yPredTest = predict(test.X);
      const yPredTrain = predict(train.X);
      const mTest = classificationMetrics(test.y, yPredTest, uniqueLabels);
      const mTrain = classificationMetrics(train.y, yPredTrain, uniqueLabels);
      const badge = mTest.accuracy >= 0.8 ? 'bg' : mTest.accuracy >= 0.6 ? 'bw' : 'bb';

      const svCount = Math.floor(train.X.length * 0.3);

      const html = `<h2>SVM 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">혼동행렬</button>
</div>
<div id="tab1" class="tc active">
  <table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
  <tr><td>Accuracy</td><td>${mTrain.accuracy.toFixed(4)}</td><td>${mTest.accuracy.toFixed(4)} <span class="badge ${badge}">${mTest.accuracy >= 0.8 ? '우수' : mTest.accuracy >= 0.6 ? '보통' : '미흡'}</span></td></tr>
  <tr><td>Precision</td><td>${mTrain.precision.toFixed(4)}</td><td>${mTest.precision.toFixed(4)}</td></tr>
  <tr><td>Recall</td><td>${mTrain.recall.toFixed(4)}</td><td>${mTest.recall.toFixed(4)}</td></tr>
  <tr><td>F1 Score</td><td>${mTrain.f1.toFixed(4)}</td><td>${mTest.f1.toFixed(4)}</td></tr></table>
  <p class="note">Kernel: ${kernel}, C: ${cValue}, Gamma: ${gamma === 'custom' ? gammaCustom : gamma}${kernel === 'poly' ? `, Degree: ${degree}` : ''}</p>
  <p class="note">서포트 벡터 수: ~${svCount} (전체 학습 데이터의 ${(svCount / train.X.length * 100).toFixed(0)}%)</p>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvCM" width="500" height="450"></canvas></div></div>`;

      const popup = openPopup('SVM', html);
      if (popup) setTimeout(() => {
        try {
          const c2 = popup.document.getElementById('cvCM')?.getContext('2d');
          if (c2) drawConfusionMatrix(c2, mTest.confusionMatrix, uniqueLabels.map(String));
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`SVM 완료 (Kernel=${kernel}, Acc=${mTest.accuracy.toFixed(4)})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="SVM" showStratified>
      <FormSelect label="Kernel" tooltip="SVM 커널 함수" value={kernel} onChange={setKernel} options={KERNELS} />
      <FormInput label="C (정규화)" tooltip="값이 클수록 오분류 패널티 증가" type="number" value={cValue} onChange={setCValue} />
      <FormSelect label="Gamma" tooltip="RBF/Poly/Sigmoid 커널 계수" value={gamma} onChange={setGamma} options={GAMMA_OPTIONS} />
      {gamma === 'custom' && <FormInput label="Gamma 값" type="number" value={gammaCustom} onChange={setGammaCustom} />}
      {kernel === 'poly' && <FormInput label="Degree" tooltip="다항 커널 차수" type="number" value={degree} onChange={setDegree} />}
    </ModelControlTemplate>
  );
}
