import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getNumColValues, getCategoricalColumns, getColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawScatterPlot, CC } from '../../../utils/chartFunctions';

export default function ScatterControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const catCols = getCategoricalColumns(columns, types);
  const [xCol, setXCol] = useState(numCols[0] || '');
  const [yCol, setYCol] = useState(numCols[1] || numCols[0] || '');
  const [regressionLine, setRegressionLine] = useState(false);
  const [hueCol, setHueCol] = useState('');
  const [sizeCol, setSizeCol] = useState('');
  const [alpha, setAlpha] = useState(0.6);

  const execute = () => {
    const xv = getNumColValues(columns, rows, xCol);
    const yv = getNumColValues(columns, rows, yCol);
    const n = Math.min(xv.length, yv.length);
    let hueColors = null;
    if (hueCol) {
      const hueVals = getColValues(columns, rows, hueCol).slice(0, n);
      const uniq = [...new Set(hueVals)];
      hueColors = hueVals.map(v => CC[uniq.indexOf(v) % CC.length] + '99');
    }
    let sizes = null;
    if (sizeCol) {
      const sv = getNumColValues(columns, rows, sizeCol).slice(0, n);
      const maxS = Math.max(...sv)||1;
      sizes = sv.map(v => 3 + (v/maxS)*15);
    }
    const p = openPopup('산포 차트', `<h2>산포 차트</h2><div class="cw"><canvas id="cv" width="850" height="450"></canvas></div>`);
    if (p) setTimeout(() => { try { drawScatterPlot(p.document.getElementById('cv').getContext('2d'), xv.slice(0,n), yv.slice(0,n), { xLabel:xCol, yLabel:yCol, title:`${xCol} vs ${yCol}`, regressionLine, hueColors, sizes, alpha }); } catch(e){} }, 200);
    addLog('산포 차트 완료', 'success');
  };

  return (
    <div>
      <FormSelect label="X축" tooltip="가로축 수치 컬럼" value={xCol} onChange={setXCol}
        options={numCols.map(c => ({ value: c, label: c }))} />
      <FormSelect label="Y축" tooltip="세로축 수치 컬럼" value={yCol} onChange={setYCol}
        options={numCols.map(c => ({ value: c, label: c }))} />
      <label className="form-checkbox"><input type="checkbox" checked={regressionLine} onChange={e => setRegressionLine(e.target.checked)} /> 회귀선 표시 <Tooltip text="추세선을 표시합니다." /></label>
      <FormSelect label="색상 구분 (Hue)" tooltip="범주별로 다른 색상 표시" value={hueCol} onChange={setHueCol}
        options={[{value:'',label:'없음'},...[...catCols,...columns].map(c => ({value:c,label:c}))]} />
      <FormSelect label="크기 변수 (Bubble)" tooltip="점 크기를 수치 변수에 비례하게 표시" value={sizeCol} onChange={setSizeCol}
        options={[{value:'',label:'없음'},...numCols.map(c => ({value:c,label:c}))]} />
      <FormInput label="투명도" tooltip="0~1 사이. 작을수록 투명" value={alpha} onChange={setAlpha} min={0.1} max={1} step={0.1} />
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
