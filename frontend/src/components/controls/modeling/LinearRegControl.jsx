import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ModelControlTemplate from './ModelControlTemplate';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { trainTestSplit, olsRegression, predictOLS, regressionMetrics } from '../../../utils/modelHelpers';
import { drawScatterPlot, drawBarChart } from '../../../utils/chartFunctions';

export default function LinearRegControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [fitIntercept, setFitIntercept] = useState(true);

  const handleExecute = ({ target, features, splitRatio, randomState }) => {
    if (!features.length) { addLog('[경고] 피처를 선택하세요.', 'warn'); return; }
    try {
      const { train, test } = trainTestSplit(columns, rows, features, target, splitRatio, randomState);
      if (train.X.length < 3) { addLog('[경고] 학습 데이터가 부족합니다.', 'warn'); return; }
      const coef = olsRegression(train.X, train.y);
      const yPredTrain = predictOLS(train.X, coef);
      const yPredTest = predictOLS(test.X, coef);
      const mTrain = regressionMetrics(train.y, yPredTrain);
      const mTest = regressionMetrics(test.y, yPredTest);
      const p = features.length;
      const adjR2 = 1 - (1 - mTest.r2) * (mTest.n - 1) / (mTest.n - p - 1 || 1);
      const badge = mTest.r2 >= 0.7 ? 'bg' : mTest.r2 >= 0.4 ? 'bw' : 'bb';
      const badgeText = mTest.r2 >= 0.7 ? '우수' : mTest.r2 >= 0.4 ? '보통' : '미흡';

      const coefRows = features.map((f, i) =>
        `<tr><td>${f}</td><td>${coef[i + 1].toFixed(4)}</td></tr>`).join('');

      const html = `<h2>Linear Regression 결과</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">성능지표</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">실제 vs 예측</button>
  <button class="tbtn" onclick="showTab(this,'tab3')">잔차</button>
  <button class="tbtn" onclick="showTab(this,'tab4')">계수</button>
</div>
<div id="tab1" class="tc active">
  <table class="mt"><tr><th>지표</th><th>Train</th><th>Test</th></tr>
  <tr><td>R²</td><td>${mTrain.r2.toFixed(4)}</td><td>${mTest.r2.toFixed(4)} <span class="badge ${badge}">${badgeText}</span></td></tr>
  <tr><td>Adj R²</td><td>-</td><td>${adjR2.toFixed(4)}</td></tr>
  <tr><td>MSE</td><td>${mTrain.mse.toFixed(2)}</td><td>${mTest.mse.toFixed(2)}</td></tr>
  <tr><td>RMSE</td><td>${mTrain.rmse.toFixed(2)}</td><td>${mTest.rmse.toFixed(2)}</td></tr>
  <tr><td>MAE</td><td>${mTrain.mae.toFixed(2)}</td><td>${mTest.mae.toFixed(2)}</td></tr>
  </table>
  <p class="note">학습 데이터: ${train.X.length}건 / 테스트 데이터: ${test.X.length}건</p>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvPred" width="750" height="400"></canvas></div></div>
<div id="tab3" class="tc"><div class="cw"><canvas id="cvResid" width="750" height="400"></canvas></div></div>
<div id="tab4" class="tc">
  ${fitIntercept ? `<p class="note">절편(Intercept): ${coef[0].toFixed(4)}</p>` : ''}
  <table class="mt"><tr><th>변수</th><th>계수</th></tr>${coefRows}</table>
  <div class="cw"><canvas id="cvCoef" width="750" height="350"></canvas></div>
</div>`;

      const popup = openPopup('Linear Regression', html);
      if (popup) setTimeout(() => {
        try {
          const c2 = popup.document.getElementById('cvPred')?.getContext('2d');
          if (c2) drawScatterPlot(c2, test.y, yPredTest, { title: '실제 vs 예측', xLabel: '실제값', yLabel: '예측값', regressionLine: true });
          const c3 = popup.document.getElementById('cvResid')?.getContext('2d');
          if (c3) { const residuals = test.y.map((v, i) => v - yPredTest[i]); drawScatterPlot(c3, yPredTest, residuals, { title: '잔차 플롯', xLabel: '예측값', yLabel: '잔차' }); }
          const c4 = popup.document.getElementById('cvCoef')?.getContext('2d');
          if (c4) drawBarChart(c4, features, coef.slice(1).map(Math.abs), { title: '변수 계수 크기', horizontal: true });
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`Linear Regression 완료 (R²=${mTest.r2.toFixed(4)})`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <ModelControlTemplate onExecute={handleExecute} modelName="Linear Regression">
      <label className="form-checkbox">
        <input type="checkbox" checked={fitIntercept} onChange={e => setFitIntercept(e.target.checked)} />
        절편 포함 (Fit Intercept)
      </label>
    </ModelControlTemplate>
  );
}
