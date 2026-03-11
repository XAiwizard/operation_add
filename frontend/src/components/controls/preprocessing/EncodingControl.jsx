import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormSelect from '../../shared/FormSelect';
import ActionButton from '../../shared/ActionButton';
import { getCategoricalColumns, getAllColumns } from '../../../utils/dataHelpers';

const ENCODINGS = [
  { value: 'onehot', label: 'One-Hot Encoding' },
  { value: 'label', label: 'Label Encoding (고유값→정수)' },
  { value: 'ordinal', label: 'Ordinal Encoding (순서 지정)' },
  { value: 'frequency', label: 'Frequency Encoding (빈도 기반)' },
  { value: 'target', label: 'Target Encoding (타겟 평균)' },
];

export default function EncodingControl() {
  const { columns, types } = useData();
  const { execEncoding } = useDataOperations();
  const catCols = getCategoricalColumns(columns, types);
  const allCols = getAllColumns(columns);
  const [selected, setSelected] = useState([]);
  const [encoding, setEncoding] = useState('onehot');

  const targetCols = encoding === 'onehot' ? catCols : allCols;

  return (
    <div>
      <InfoBox>범주형 변수를 수치 데이터로 변환합니다.</InfoBox>

      <FormSelect
        label="인코딩 방식"
        tooltip="One-Hot: 이진 컬럼 생성, Label: 정수 매핑, Ordinal: 순서 매핑, Frequency: 빈도 비율, Target: 타겟 평균값"
        value={encoding}
        onChange={setEncoding}
        options={ENCODINGS}
      />

      <div className="form-group">
        <label className="form-label">
          대상 컬럼 <Tooltip text="인코딩할 컬럼을 선택합니다." />
        </label>
        {targetCols.length > 0
          ? <ColumnCheckboxList columns={targetCols} name="enc_cols" onChange={setSelected} />
          : <div style={{ color: '#e74c3c', fontSize: '0.85rem' }}>대상 컬럼 없음</div>
        }
      </div>

      <ActionButton onClick={() => execEncoding(selected, encoding)} disabled={targetCols.length === 0}>
        인코딩 적용
      </ActionButton>
    </div>
  );
}
