import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawBarChart } from '../../../utils/chartFunctions';

export default function BarChartControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [xCol, setXCol] = useState(columns[0] || '');
  const [yCol, setYCol] = useState('');
  const [horizontal, setHorizontal] = useState(false);
  const [sortOrder, setSortOrder] = useState('none');

  const execute = () => {
    let lb, vl, yl;
    if (!yCol) {
      const f = {}; getColValues(columns, rows, xCol).forEach(v => { f[v]=(f[v]||0)+1; });
      lb = Object.keys(f); vl = Object.values(f); yl = 'Count';
    } else {
      const g = {}, xi = columns.indexOf(xCol), yi = columns.indexOf(yCol);
      rows.forEach(r => { const k = String(r[xi]); if(!g[k]) g[k]=[]; const v=Number(r[yi]); if(!isNaN(v)) g[k].push(v); });
      lb = Object.keys(g); vl = lb.map(k => g[k].length ? g[k].reduce((a,b)=>a+b,0)/g[k].length : 0); yl = `${yCol}(평균)`;
    }
    if (sortOrder === 'asc') { const pairs = lb.map((l,i)=>({l,v:vl[i]})).sort((a,b)=>a.v-b.v); lb=pairs.map(p=>p.l); vl=pairs.map(p=>p.v); }
    else if (sortOrder === 'desc') { const pairs = lb.map((l,i)=>({l,v:vl[i]})).sort((a,b)=>b.v-a.v); lb=pairs.map(p=>p.l); vl=pairs.map(p=>p.v); }
    const p = openPopup('막대 차트', `<h2>막대 차트</h2><div class="cw"><canvas id="cv" width="850" height="420"></canvas></div>`);
    if (p) setTimeout(() => { try { drawBarChart(p.document.getElementById('cv').getContext('2d'), lb, vl, { title: `${yl} by ${xCol}`, dec: yCol?1:0, horizontal }); } catch(e){} }, 200);
    addLog('막대 차트 완료', 'success');
  };

  return (
    <div>
      <FormSelect label="X축 (범주)" tooltip="막대로 표시할 범주 컬럼" value={xCol} onChange={setXCol}
        options={columns.map(c => ({ value: c, label: c }))} />
      <FormSelect label="Y축" tooltip="빈도: 각 범주 개수, 수치 선택시 그룹 평균" value={yCol} onChange={setYCol}
        options={[{value:'',label:'빈도수 (Count)'},...numCols.map(c => ({value:c,label:`${c} (평균)`}))]} />
      <label className="form-checkbox"><input type="checkbox" checked={horizontal} onChange={e => setHorizontal(e.target.checked)} /> 가로형 차트 <Tooltip text="막대를 가로 방향으로 표시" /></label>
      <FormSelect label="정렬" tooltip="막대 정렬 순서" value={sortOrder} onChange={setSortOrder}
        options={[{value:'none',label:'원본 순서'},{value:'asc',label:'오름차순'},{value:'desc',label:'내림차순'}]} />
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
