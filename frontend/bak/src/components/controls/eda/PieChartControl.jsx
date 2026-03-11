import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawPieChart } from '../../../utils/chartFunctions';

export default function PieChartControl() {
  const { columns, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const [col, setCol] = useState(columns[0] || '');
  const [donut, setDonut] = useState(false);
  const [showPercent, setShowPercent] = useState(true);
  const [topN, setTopN] = useState(0);

  const execute = () => {
    const v = getColValues(columns, rows, col);
    const freq = {}; v.forEach(x => { freq[x] = (freq[x]||0)+1; });
    let labels = Object.keys(freq), values = Object.values(freq);
    if (topN > 0 && labels.length > topN) {
      const sorted = labels.map((l,i) => ({l, v: values[i]})).sort((a,b) => b.v - a.v);
      const top = sorted.slice(0, topN);
      const otherCount = sorted.slice(topN).reduce((a,b) => a + b.v, 0);
      labels = top.map(x => x.l); values = top.map(x => x.v);
      if (otherCount > 0) { labels.push('기타'); values.push(otherCount); }
    }
    const p = openPopup('파이 차트', `<h2>파이 차트 — ${col}</h2><div class="cw"><canvas id="cv" width="700" height="450"></canvas></div>`);
    if (p) setTimeout(() => { try { drawPieChart(p.document.getElementById('cv').getContext('2d'), labels, values, { title: col, donut, showPercent }); } catch(e){} }, 200);
    addLog('파이 차트 완료', 'success');
  };

  return (
    <div>
      <FormSelect label="범주 컬럼" tooltip="각 고유값 비율을 원형으로 시각화"
        value={col} onChange={setCol} options={columns.map(c => ({ value: c, label: c }))} />
      <label className="form-checkbox"><input type="checkbox" checked={donut} onChange={e => setDonut(e.target.checked)} /> 도넛 차트 <Tooltip text="가운데가 비어있는 도넛 형태" /></label>
      <label className="form-checkbox"><input type="checkbox" checked={showPercent} onChange={e => setShowPercent(e.target.checked)} /> 비율(%) 표시</label>
      <FormInput label="상위 N개만 표시" tooltip="0이면 전체 표시. 나머지는 '기타'로 합산" value={topN} onChange={setTopN} min={0} max={20} />
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
