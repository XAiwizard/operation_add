import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getNumColValues, getColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';

export default function StatisticsControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [selected, setSelected] = useState([...numCols]);

  const execute = () => {
    if (!selected.length) { addLog('[경고] 컬럼을 선택하세요.', 'warn'); return; }
    const stats = ['Count','Mean','Std','Variance','Min','25%','50%','75%','Max','Skewness','Kurtosis','Unique','Missing'];
    const data = {};
    selected.forEach(c => {
      const v = getNumColValues(columns, rows, c);
      const s = [...v].sort((a,b)=>a-b);
      const mn = v.reduce((a,b)=>a+b,0)/v.length;
      const sd = Math.sqrt(v.reduce((a,b)=>a+(b-mn)**2,0)/v.length);
      const variance = sd*sd;
      const n = v.length;
      const skew = n>2 ? v.reduce((a,b)=>a+((b-mn)/sd)**3,0)/n : 0;
      const kurt = n>3 ? v.reduce((a,b)=>a+((b-mn)/sd)**4,0)/n - 3 : 0;
      const unique = new Set(getColValues(columns, rows, c)).size;
      const missing = rows.length - getColValues(columns, rows, c).length;
      data[c] = [n, mn.toFixed(2), sd.toFixed(2), variance.toFixed(2),
        Math.min(...v).toFixed(2), s[Math.floor(s.length*0.25)]?.toFixed(2)||'-',
        s[Math.floor(s.length*0.5)]?.toFixed(2)||'-', s[Math.floor(s.length*0.75)]?.toFixed(2)||'-',
        Math.max(...v).toFixed(2), skew.toFixed(4), kurt.toFixed(4), unique, missing];
    });
    let t = '<table class="st"><tr><th>통계량</th>' + selected.map(c=>`<th>${c}</th>`).join('') + '</tr>';
    stats.forEach((s,si) => { t += `<tr><td style="font-weight:600;text-align:left">${s}</td>` + selected.map(c=>`<td>${data[c][si]}</td>`).join('') + '</tr>'; });
    t += '</table>';
    openPopup('기술 통계', `<h2>기술 통계</h2>${t}`);
    addLog('기술 통계 완료', 'success');
  };

  return (
    <div>
      <div className="form-group">
        <label className="form-label">대상 컬럼 <Tooltip text="Count, Mean, Std, Variance, Min, Q1~Q3, Max, Skewness, Kurtosis, Unique, Missing 산출" /></label>
        <ColumnCheckboxList columns={numCols} name="stat_cols" checked={true} onChange={setSelected} />
      </div>
      <ActionButton onClick={execute}>통계 산출</ActionButton>
    </div>
  );
}
