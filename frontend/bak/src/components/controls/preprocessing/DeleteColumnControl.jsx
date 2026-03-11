import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';

export default function DeleteColumnControl() {
  const { columns } = useData();
  const { execDeleteColumns, execDeleteByMissingRate } = useDataOperations();
  const [selected, setSelected] = useState([]);
  const [missingThreshold, setMissingThreshold] = useState(50);

  return (
    <div>
      <InfoBox>불필요한 컬럼을 선택하여 삭제합니다.</InfoBox>

      <div className="form-group">
        <label className="form-label">
          대상 컬럼 <Tooltip text="삭제할 컬럼을 체크하세요. 복수 선택 가능." />
        </label>
        <ColumnCheckboxList columns={columns} name="del_cols" onChange={setSelected} />
      </div>
      <ActionButton variant="danger" onClick={() => execDeleteColumns(selected)}>
        선택 컬럼 삭제
      </ActionButton>

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px dashed #ddd' }} />

      <div className="form-group">
        <label className="form-label">
          결측률 기준 삭제 <Tooltip text="지정한 비율 이상 결측값이 있는 컬럼을 자동 삭제합니다." />
        </label>
        <FormInput
          type="number"
          value={missingThreshold}
          onChange={setMissingThreshold}
          min={1} max={100}
          placeholder="결측률 (%)"
        />
      </div>
      <ActionButton variant="danger" onClick={() => execDeleteByMissingRate(missingThreshold)}>
        결측률 {missingThreshold}% 이상 컬럼 삭제
      </ActionButton>
    </div>
  );
}
