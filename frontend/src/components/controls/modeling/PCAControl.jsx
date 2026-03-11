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
import { getNumericColumns } from '../../../utils/dataHelpers';
import { simplePCA } from '../../../utils/modelHelpers';
import { drawBarChart, drawScatterPlot, drawHeatmap } from '../../../utils/chartFunctions';

const SVD_SOLVERS = [
  { value: 'auto', label: 'auto' },
  { value: 'full', label: 'full' },
  { value: 'arpack', label: 'arpack' },
  { value: 'randomized', label: 'randomized' },
];

export default function PCAControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [features, setFeatures] = useState([]);
  const [nComponents, setNComponents] = useState(2);
  const [standardize, setStandardize] = useState(true);
  const [whiten, setWhiten] = useState(false);
  const [svdSolver, setSvdSolver] = useState('auto');

  const execute = () => {
    if (features.length < 2) { addLog('[경고] 2개 이상 피처를 선택하세요.', 'warn'); return; }
    try {
      const X = [];
      rows.forEach(row => {
        const vals = features.map(f => {
          const ci = columns.indexOf(f);
          return row[ci] != null ? Number(row[ci]) : NaN;
        });
        if (vals.every(v => !isNaN(v))) X.push(vals);
      });
      if (X.length < 3) { addLog('[경고] 데이터가 부족합니다.', 'warn'); return; }

      const nComp = Math.min(nComponents, features.length);
      const result = simplePCA(X, nComp);

      const cumRatio = [];
      let cum = 0;
      result.explainedRatio.forEach(r => { cum += r; cumRatio.push(parseFloat(cum.toFixed(4))); });
      const ratioLabels = result.explainedRatio.map((_, i) => `PC${i + 1}`);
      const ratioVals = result.explainedRatio.map(v => parseFloat((v * 100).toFixed(2)));

      // Loading matrix
      const loadingMatrix = result.loadings.map(vec => vec.map(v => parseFloat(v.toFixed(3))));
      const loadingRows = features.map((f, fi) =>
        `<tr><td><b>${f}</b></td>${loadingMatrix.map(pc => `<td>${pc[fi].toFixed(3)}</td>`).join('')}</tr>`
      ).join('');

      const html = `<h2>PCA 결과 (${nComp} Components)</h2>
<div class="tb">
  <button class="tbtn active" onclick="showTab(this,'tab1')">분산 설명력</button>
  <button class="tbtn" onclick="showTab(this,'tab2')">주성분 산점도</button>
  <button class="tbtn" onclick="showTab(this,'tab3')">로딩 행렬</button>
</div>
<div id="tab1" class="tc active">
  <table class="mt"><tr><th>주성분</th><th>분산 설명력 (%)</th><th>누적 (%)</th></tr>
    ${ratioLabels.map((l, i) => `<tr><td>${l}</td><td>${ratioVals[i].toFixed(2)}%</td><td>${(cumRatio[i] * 100).toFixed(2)}%</td></tr>`).join('')}
  </table>
  <p class="note">총 분산 설명력: ${(cum * 100).toFixed(2)}%</p>
  <div class="cw"><canvas id="cvVar" width="750" height="380"></canvas></div>
</div>
<div id="tab2" class="tc"><div class="cw"><canvas id="cvPC" width="750" height="420"></canvas></div></div>
<div id="tab3" class="tc">
  <table class="st"><tr><th>변수</th>${ratioLabels.map(l => `<th>${l}</th>`).join('')}</tr>${loadingRows}</table>
  ${nComp <= features.length ? '<div class="cw"><canvas id="cvLoad" width="750" height="400"></canvas></div>' : ''}
</div>`;

      const popup = openPopup('PCA', html);
      if (popup) setTimeout(() => {
        try {
          const c1 = popup.document.getElementById('cvVar')?.getContext('2d');
          if (c1) drawBarChart(c1, ratioLabels, ratioVals, { title: '분산 설명력 (%)', dec: 2 });
          const c2 = popup.document.getElementById('cvPC')?.getContext('2d');
          if (c2 && nComp >= 2) {
            drawScatterPlot(c2,
              result.transformed.map(r => r[0]),
              result.transformed.map(r => r[1]),
              { title: 'PC1 vs PC2', xLabel: `PC1 (${ratioVals[0]}%)`, yLabel: `PC2 (${ratioVals[1]}%)`, alpha: 0.6 }
            );
          }
          const c3 = popup.document.getElementById('cvLoad')?.getContext('2d');
          if (c3 && loadingMatrix.length > 0) {
            // Transpose for heatmap: features x components
            const heatData = features.map((_, fi) => loadingMatrix.map(pc => pc[fi]));
            drawHeatmap(c3, heatData, features, { title: '로딩 행렬 히트맵' });
          }
        } catch (e) { console.error(e); }
      }, 300);

      addLog(`PCA 완료 (${nComp} 주성분, 분산 설명력: ${(cum * 100).toFixed(1)}%)`, 'success');
    } catch (e) { addLog(`[오류] ${e.message}`, 'error'); }
  };

  return (
    <div>
      <InfoBox>주성분 분석(PCA)으로 차원을 축소합니다.</InfoBox>
      <div className="form-group">
        <label className="form-label">피처 선택 <Tooltip text="차원 축소할 수치형 컬럼 (2개 이상)" /></label>
        <ColumnCheckboxList columns={numCols} name="pca_feat" onChange={setFeatures} />
      </div>
      <FormInput label="주성분 수" tooltip="추출할 주성분 개수" type="number" value={nComponents} onChange={setNComponents} />
      <label className="form-checkbox">
        <input type="checkbox" checked={standardize} onChange={e => setStandardize(e.target.checked)} /> 표준화 (Standardize)
      </label>
      <label className="form-checkbox">
        <input type="checkbox" checked={whiten} onChange={e => setWhiten(e.target.checked)} /> Whiten
      </label>
      <FormSelect label="SVD Solver" tooltip="특이값 분해 알고리즘" value={svdSolver} onChange={setSvdSolver} options={SVD_SOLVERS} />
      <ActionButton onClick={execute}>PCA 실행</ActionButton>
    </div>
  );
}
