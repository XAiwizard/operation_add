import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, olsRegression, predictOLS, regressionMetrics } from '../../../utils/modelHelpers';
import { drawScatterPlot, drawBarChart } from '../../../utils/chartFunctions';

const FEAT_SELECTION = [
  { value: 'none', label: '없음' },
  { value: 'stepwise_forward', label: 'Forward Selection' },
  { value: 'stepwise_backward', label: 'Backward Elimination' },
];

export default function MLRControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [fitIntercept, setFitIntercept] = useState(true);
  const [featureSelection, setFeatureSelection] = useState('none');
  const [vifThreshold, setVifThreshold] = useState(10);

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (features.length < 2) { addLog('[경고] 2개 이상 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < features.length + 2) { addLog('[경고] 학습 데이터가 부족합니다.', 'warn'); return; }

      const coef = olsRegression(train.X, train.y);
      const yPredTrain = predictOLS(train.X, coef);
      const yPredTest = predictOLS(test.X, coef);
      const mTrain = regressionMetrics(train.y, yPredTrain);
      const mTest = regressionMetrics(test.y, yPredTest);
      const p = features.length;
      const adjR2 = 1 - (1 - mTest.r2) * (mTest.n - 1) / (mTest.n - p - 1 || 1);
      const badge = mTest.r2 >= 0.7 ? 'bg' : mTest.r2 >= 0.4 ? 'bw' : 'bb';

      // Compute VIF (simplified: R² of each feature regressed on others)
      const vifs = features.map((_, fi) => {
        if (features.length < 2) return 1;
        const yf = train.X.map(r => r[fi]);
        const Xf = train.X.map(r => r.filter((_, j) => j !== fi));
        try {
          const c = olsRegression(Xf, yf);
          const pred = predictOLS(Xf, c);
          const m = regressionMetrics(yf, pred);
          return 1 / (1 - m.r2 || 0.01);
        } catch { return 1; }
      });

      const coefRows = features.map((f, i) =>
        `<tr><td>${f}</td><td>${coef[i + 1].toFixed(4)}</td><td>${vifs[i].toFixed(2)} ${vifs[i] > vifThreshold ? '<span class="badge bb">주의</span>' : '<span class="badge bg">정상</span>'}</td></tr>`
      ).join('');

      const residuals = test.y.map((v, i) => v - yPredTest[i]);

      // Durbin-Watson statistic (simplified)
      let dw = 0;
      const residSum = residuals.reduce((s, v) => s + v * v, 0);
      for (let i = 1; i < residuals.length; i++) dw += (residuals[i] - residuals[i - 1]) ** 2;
      dw = residSum > 0 ? (dw / residSum) : 2;

      const html = `<h2>다중 선형 회귀 (MLR) 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">실제 vs 예측</button>
  <button class="tbtn" onclick="showTab(this,'tab3')">잔차</button>
  <button class="tbtn" onclick="showTab(this,'tab4')">계수 / VIF</button>
</div>
<div id="tab1" class="tc active">
  <table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
  <tr><td>R²</td><td>${mTrain.r2.toFixed(4)}</td><td>${mTest.r2.toFixed(4)} <span class="badge ${badge}">${mTest.r2 >= 0.7 ? '우수' : mTest.r2 >= 0.4 ? '보통' : '미흡'}</span></td></tr>
  <tr><td>Adj R²</td><td>-</td><td>${adjR2.toFixed(4)}</td></tr>
  <tr><td>MSE</td><td>${mTrain.mse.toFixed(2)}</td><td>${mTest.mse.toFixed(2)}</td></tr>
  <tr><td>RMSE</td><td>${mTrain.rmse.toFixed(2)}</td><td>${mTest.rmse.toFixed(2)}</td></tr>
  <tr><td>MAE</td><td>${mTrain.mae.toFixed(2)}</td><td>${mTest.mae.toFixed(2)}</td></tr>
  <tr><td>Durbin-Watson</td><td>-</td><td>${dw.toFixed(4)}</td></tr></table>
  <p class="note">학습: ${train.X.length}건 / 테스트: ${test.X.length}건 / Feature Selection: ${featureSelection}</p>
  ${vifs.some(v => v > vifThreshold) ? '<p class="owarn">⚠ VIF > ' + vifThreshold + '인 변수가 있습니다. 다중공선성을 확인하세요.</p>' : ''}
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvPred" width="750" height="400"></canvas></div></div>
<div id="tab3" class="tc"><div class="cw"><canvas id="cvResid" width="750" height="400"></canvas></div></div>
<div id="tab4" class="tc">
  ${fitIntercept ? `<p class="note">절편(Intercept): ${coef[0].toFixed(4)}</p>` : ''}
  <table class="mt"><tr><th>변수</th><th>계수</th><th>VIF</th></tr>${coefRows}</table>
  <div class="cw"><canvas id="cvCoef" width="750" height="350"></canvas></div>
</div>`;

      const popup = openPopup('MLR (다중선형회귀)', html, 1000, 750);
      if (popup) setTimeout(() => {
        try {
          const c2 = popup.document.getElementById('cvPred')?.getContext('2d');
          if (c2) drawScatterPlot(c2, test.y, yPredTest, { title: '실제 vs 예측', xLabel: '실제값', yLabel: '예측값', regressionLine: true });
          const c3 = popup.document.getElementById('cvResid')?.getContext('2d');
          if (c3) drawScatterPlot(c3, yPredTest, residuals, { title: '잔차 플롯', xLabel: '예측값', yLabel: '잔차' });
          const c4 = popup.document.getElementById('cvCoef')?.getContext('2d');
          if (c4) drawBarChart(c4, features, coef.slice(1).map(Math.abs), { title: '변수 계수 크기 (절대값)', horizontal: true, dec: 4 });
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`MLR 완료 (R²=${mTest.r2.toFixed(4)}, Adj R²=${adjR2.toFixed(4)})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="다중선형회귀 (MLR)">
      <label className="form-checkbox">
        <input type="checkbox" checked={fitIntercept} onChange={e => setFitIntercept(e.target.checked)} />
        절편 포함 (Fit Intercept)
      </label>
      <FormSelect label="변수 선택법" tooltip="자동 변수 선택 방법" value={featureSelection} onChange={setFeatureSelection} options={FEAT_SELECTION} />
      <FormInput label="VIF 임계값" tooltip="이 값 이상은 다중공선성 경고" type="number" value={vifThreshold} onChange={setVifThreshold} />
    </ModelControlTemplate>
  );
}
