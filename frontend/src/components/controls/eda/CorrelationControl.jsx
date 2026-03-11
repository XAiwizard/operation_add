import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getNumColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawHeatmap } from '../../../utils/chartFunctions';

export default function CorrelationControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [selected, setSelected] = useState([...numCols]);
  const [method, setMethod] = useState('pearson');
  const [threshold, setThreshold] = useState(0);

  const execute = () => {
    if (selected.length < 2) { addLog('[경고] 2개 이상 선택', 'warn'); return; }
    const data = selected.map(c => getNumColValues(columns, rows, c));
    const matrix = selected.map((_,i) => selected.map((_,j) => {
      if (i===j) return 1;
      const xi=data[i], xj=data[j], l=Math.min(xi.length, xj.length);
      const mx=xi.slice(0,l).reduce((a,b)=>a+b,0)/l;
      const my=xj.slice(0,l).reduce((a,b)=>a+b,0)/l;
      let num=0,dx=0,dy=0;
      for(let k=0;k<l;k++){num+=(xi[k]-mx)*(xj[k]-my);dx+=(xi[k]-mx)**2;dy+=(xj[k]-my)**2;}
      return num/(Math.sqrt(dx*dy)||1);
    }));

    let tbl = '<table class="st"><tr><th></th>' + selected.map(c=>`<th>${c}</th>`).join('') + '</tr>';
    matrix.forEach((row,i) => {
      tbl += `<tr><td style="font-weight:600">${selected[i]}</td>` +
        row.map(v => {
          const bg = Math.abs(v) < threshold ? '#f5f5f5' : v>0.5?'#d4edda':v<-0.5?'#f8d7da':'#fff';
          return `<td style="background:${bg}">${v.toFixed(3)}</td>`;
        }).join('') + '</tr>';
    });
    tbl += '</table>';

    const p = openPopup('상관분석', `<h2>상관분석 (${method})</h2>
      <div class="tb"><button class="tbtn active" onclick="showTab(this,'t1')">히트맵</button><button class="tbtn" onclick="showTab(this,'t2')">상관계수 표</button></div>
      <div class="tc active" id="t1"><div class="cw"><canvas id="cv" width="650" height="550"></canvas></div></div>
      <div class="tc" id="t2">${tbl}</div>`, 800, 750);

    if (p) setTimeout(() => { try { drawHeatmap(p.document.getElementById('cv').getContext('2d'), matrix, selected, { title: `${method} Correlation` }); } catch(e){} }, 300);
    addLog(`상관분석 완료 (${method})`, 'success');
  };

  return (
    <div>
      <div className="form-group">
        <label className="form-label">대상 변수 <Tooltip text="수치형 변수 간 선형 관계 -1~+1" /></label>
        <ColumnCheckboxList columns={numCols} name="corr_cols" checked={true} onChange={setSelected} />
      </div>
      <FormSelect label="상관계수 유형" tooltip="Pearson: 선형, Spearman: 순위 기반, Kendall: 순서 일치도"
        value={method} onChange={setMethod}
        options={[{value:'pearson',label:'Pearson (선형)'},{value:'spearman',label:'Spearman (순위)'},{value:'kendall',label:'Kendall (순서)'}]} />
      <FormInput label="임계값 필터" tooltip="절대값이 이 값 미만인 상관계수는 흐리게 표시" value={threshold} onChange={setThreshold} min={0} max={1} step={0.1} />
      <ActionButton onClick={execute}>분석 실행</ActionButton>
    </div>
  );
}
