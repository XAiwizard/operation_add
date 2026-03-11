import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import WarnBox from '../../shared/WarnBox';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { countMissing } from '../../../utils/dataHelpers';

const METHODS = [
  { value: 'drop_row', label: '행 삭제 (Drop Rows)' },
  { value: 'mean', label: '평균값 대체 (Mean)' },
  { value: 'median', label: '중앙값 대체 (Median)' },
  { value: 'mode', label: '최빈값 대체 (Mode)' },
  { value: 'zero', label: '0으로 대체' },
  { value: 'custom', label: '사용자 지정 값' },
  { value: 'ffill', label: '앞 값 채우기 (Forward Fill)' },
  { value: 'bfill', label: '뒤 값 채우기 (Backward Fill)' },
  { value: 'interpolation', label: '선형 보간 (Interpolation)' },
  { value: 'drop_column', label: '해당 컬럼 삭제' },
];

export default function MissingValueControl() {
  const { columns, rows } = useData();
  const { execMissingValue } = useDataOperations();
  const [selected, setSelected] = useState([...columns]);
  const [method, setMethod] = useState('drop_row');
  const [customValue, setCustomValue] = useState(0);

  return (
    <div>
      <WarnBox>현재 결측치: <strong>{countMissing(rows)}</strong>건</WarnBox>

      <div className="form-group">
        <label className="form-label">
          대상 컬럼 <Tooltip text="결측치를 처리할 컬럼을 선택합니다." />
        </label>
        <ColumnCheckboxList columns={columns} name="mv_cols" checked={true} onChange={setSelected} />
      </div>

      <FormSelect
        label="처리 방법"
        tooltip="Drop: 결측 행 삭제, Mean/Median/Mode: 대표값 대체, FFill/BFill: 이전/이후 값 채우기"
        value={method}
        onChange={setMethod}
        options={METHODS}
      />

      {method === 'custom' && (
        <FormInput
          label="사용자 지정 값"
          tooltip="결측값을 대체할 값을 직접 입력합니다."
          type="text"
          value={customValue}
          onChange={setCustomValue}
          placeholder="대체할 값 입력"
        />
      )}

      <ActionButton onClick={() => execMissingValue(selected, method, customValue)}>
        결측치 처리 실행
      </ActionButton>
    </div>
  );
}
