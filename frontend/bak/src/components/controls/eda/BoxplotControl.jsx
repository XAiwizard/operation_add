import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useLog } from '../../../contexts/LogContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns, getNumColValues } from '../../../utils/dataHelpers';
import usePopupWindow from '../../../hooks/usePopupWindow';
import { drawBoxPlot } from '../../../utils/chartFunctions';

export default function BoxplotControl() {
  const { columns, types, rows } = useData();
  const { addLog } = useLog();
  const { openPopup } = usePopupWindow();
  const numCols = getNumericColumns(columns, types);
  const [selected, setSelected] = useState([]);
  const [showOutliers, setShowOutliers] = useState(true);

  const execute = () => {
    if (!selected.length) { addLog('[경고] 컬럼을 선택하세요.', 'warn'); return; }
    const ds = selected.map(c => getNumColValues(columns, rows, c));
    const p = openPopup('박스플롯', `<h2>박스플롯</h2><div class="cw"><canvas id="cv" width="850" height="450"></canvas></div>`);
    if (p) setTimeout(() => { try { drawBoxPlot(p.document.getElementById('cv').getContext('2d'), ds, selected, { title: 'Box Plot', showOutliers }); } catch(e){} }, 200);
    addLog('박스플롯 완료', 'success');
  };

  return (
    <div>
      <div className="form-group">
        <label className="form-label">대상 컬럼 <Tooltip text="Q1~Q3, 중앙값, 이상치 비교" /></label>
        <ColumnCheckboxList columns={numCols} name="box_cols" onChange={setSelected} />
      </div>
      <label className="form-checkbox"><input type="checkbox" checked={showOutliers} onChange={e => setShowOutliers(e.target.checked)} /> 이상치 표시 <Tooltip text="IQR 1.5배 밖의 점 표시" /></label>
      <ActionButton onClick={execute}>차트 그리기</ActionButton>
    </div>
  );
}
