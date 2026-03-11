import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getColValues, getNumColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawLineChart } from '../../../utils/chartFunctions';

export default function LineChartControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [xCol, setXCol] = useState(columns[0] || '');
  const [yCols, setYCols] = useState([]);
  const [title, setTitle] = useState('');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [legendPos, setLegendPos] = useState('top');

  const execute = () => {
    if (!yCols.length) { addLog('[경고] Y축을 선택하세요.', 'warn'); return; }
    const lb = getColValues(columns, rows, xCol).slice(0,30).map(String);
    const ds = yCols.map(c => ({ label: c, values: getNumColValues(columns, rows, c).slice(0,30) }));
    const chartTitle = title || `${yCols.join(', ')} by ${xCol}`;
    const p = openPopup('꺾은선 차트', `<h2>꺾은선 차트</h2><div class="cw"><canvas id="cv" width="850" height="420"></canvas></div>`);
    if (p) setTimeout(() => { try { drawLineChart(p.document.getElementById('cv').getContext('2d'), lb, ds, { title: chartTitle, markers: showMarkers, grid: showGrid, legendPos }); } catch(e){} }, 200);
    addLog('꺾은선 차트 완료', 'success');
  };

  return (
    <div>
      <FormSelect label="X축" tooltip="시간이나 순서 컬럼" value={xCol} onChange={setXCol}
        options={columns.map(c => ({ value: c, label: c }))} />
      <div className="form-group">
        <label className="form-label">Y축 (수치) <Tooltip text="복수 선택시 다중 라인" /></label>
        <ColumnCheckboxList columns={numCols} name="line_y" onChange={setYCols} />
      </div>
      <FormInput label="차트 제목" tooltip="비워두면 자동 생성" type="text" value={title} onChange={setTitle} placeholder="차트 제목 입력" />
      <label className="form-checkbox"><input type="checkbox" checked={showMarkers} onChange={e => setShowMarkers(e.target.checked)} /> 마커 표시</label>
      <label className="form-checkbox"><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> 그리드 표시</label>
      <FormSelect label="범례 위치" tooltip="범례 표시 위치" value={legendPos} onChange={setLegendPos}
        options={[{value:'top',label:'상단'},{value:'bottom',label:'하단'}]} />
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
