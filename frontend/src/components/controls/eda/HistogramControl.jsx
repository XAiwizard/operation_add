import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getNumColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawHistogram } from '../../../utils/chartFunctions';

export default function HistogramControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [col, setCol] = useState(numCols[0] || '');
  const [bins, setBins] = useState(10);
  const [kde, setKde] = useState(false);
  const [cumulative, setCumulative] = useState(false);
  const [normalize, setNormalize] = useState(false);

  const execute = () => {
    const v = getNumColValues(columns, rows, col);
    if (!v.length) { addLog('[경고] 데이터 없음', 'warn'); return; }
    const p = openPopup('히스토그램', `<h2>히스토그램 — ${col}</h2><div class="cw"><canvas id="cv" width="850" height="420"></canvas></div><div class="note">${v.length}건 | Bins: ${bins}${kde?' | KDE':''}${cumulative?' | 누적':''}${normalize?' | 정규화':''}</div>`);
    if (p) setTimeout(() => { try { drawHistogram(p.document.getElementById('cv').getContext('2d'), v, { bins, title: `${col} Distribution`, kde, cumulative, normalize }); } catch(e){} }, 200);
    addLog(`히스토그램 (${col})`, 'success');
  };

  return (
    <div>
      <FormSelect label="대상 컬럼" tooltip="수치형 값 분포를 구간별 빈도로 표시"
        value={col} onChange={setCol} options={numCols.map(c => ({ value: c, label: c }))} />
      <FormInput label="구간 수 (Bins)" tooltip="클수록 세밀한 분포" value={bins} onChange={setBins} min={3} max={50} />
      <label className="form-checkbox"><input type="checkbox" checked={kde} onChange={e => setKde(e.target.checked)} /> KDE 곡선 오버레이 <Tooltip text="커널 밀도 추정 곡선을 함께 표시합니다." /></label>
      <label className="form-checkbox"><input type="checkbox" checked={cumulative} onChange={e => setCumulative(e.target.checked)} /> 누적 히스토그램</label>
      <label className="form-checkbox"><input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} /> 정규화 (Normalize)</label>
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
