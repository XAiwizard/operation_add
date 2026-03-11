import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormSelect from '../../shared/FormSelect';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns } from '../../../utils/dataHelpers';

const SCALERS = [
  { value: 'standard', label: 'StandardScaler (Z-score)' },
  { value: 'minmax', label: 'MinMaxScaler (0~1)' },
  { value: 'robust', label: 'RobustScaler (IQR)' },
  { value: 'maxabs', label: 'MaxAbsScaler (최대 절대값)' },
  { value: 'log', label: 'Log 변환 (log(1+x))' },
  { value: 'boxcox', label: 'Box-Cox (양수만)' },
  { value: 'yeojohnson', label: 'Yeo-Johnson (음수 허용)' },
];

export default function ScalingControl() {
  const { columns, types } = useData();
  const { execScaling } = useDataOperations();
  const numCols = getNumericColumns(columns, types);
  const [selected, setSelected] = useState([]);
  const [scaler, setScaler] = useState('standard');

  return (
    <div>
      <InfoBox>수치형 컬럼의 값 범위를 정규화합니다.</InfoBox>

      <div className="form-group">
        <label className="form-label">
          대상 컬럼 <Tooltip text="스케일링할 수치형 컬럼을 선택합니다." />
        </label>
        <ColumnCheckboxList columns={numCols} name="sc_cols" onChange={setSelected} />
      </div>

      <FormSelect
        label="스케일러"
        tooltip="Standard: 평균0/표준편차1, MinMax: 0~1, Robust: IQR 기반, Log: 로그 변환, Box-Cox/Yeo-Johnson: 정규분포 근사"
        value={scaler}
        onChange={setScaler}
        options={SCALERS}
      />

      <ActionButton onClick={() => execScaling(selected, scaler)}>
        스케일링 적용
      </ActionButton>
    </div>
  );
}
