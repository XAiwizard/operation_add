import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import ColumnCheckboxList from '../../shared/ColumnCheckboxList';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';
import { getNumericColumns } from '../../../utils/dataHelpers';

const SPLIT_OPTIONS = [
  { value: '0.1', label: '90 / 10' },
  { value: '0.2', label: '80 / 20' },
  { value: '0.3', label: '70 / 30' },
  { value: '0.4', label: '60 / 40' },
];
const KFOLD_OPTIONS = [
  { value: '0', label: '없음' },
  { value: '3', label: '3-Fold' },
  { value: '5', label: '5-Fold' },
  { value: '10', label: '10-Fold' },
];

export default function ModelControlTemplate({ children, onExecute, modelName, showStratified = false }) {
  const { columns, types } = useData();
  const numCols = getNumericColumns(columns, types);
  const [target, setTarget] = useState(columns[0] || '');
  const [features, setFeatures] = useState([]);
  const [splitRatio, setSplitRatio] = useState('0.2');
  const [randomState, setRandomState] = useState(42);
  const [kFold, setKFold] = useState('0');
  const [stratified, setStratified] = useState(false);

  const handleExecute = () => {
    onExecute({ target, features, splitRatio: parseFloat(splitRatio), randomState, kFold: parseInt(kFold), stratified });
  };

  return (
    <div>
      <InfoBox>{modelName} 모델을 학습하고 결과를 확인합니다.</InfoBox>

      <FormSelect
        label="타겟 변수 (Y)"
        tooltip="예측할 대상 컬럼을 선택합니다."
        value={target}
        onChange={setTarget}
        options={columns.map(c => ({ value: c, label: c }))}
      />

      <div className="form-group">
        <label className="form-label">
          피처 (X) <Tooltip text="학습에 사용할 수치형 컬럼을 선택합니다." />
        </label>
        <ColumnCheckboxList columns={numCols} name={`${modelName}_feat`} onChange={setFeatures} />
      </div>

      {children}

      <FormSelect label="Train / Test 비율" tooltip="테스트 데이터 비율" value={splitRatio} onChange={setSplitRatio} options={SPLIT_OPTIONS} />
      <FormInput label="Random State" tooltip="재현성을 위한 시드값" type="number" value={randomState} onChange={setRandomState} />
      <FormSelect label="K-Fold 교차검증" tooltip="교차검증 Fold 수" value={kFold} onChange={setKFold} options={KFOLD_OPTIONS} />

      {showStratified && (
        <label className="form-checkbox">
          <input type="checkbox" checked={stratified} onChange={e => setStratified(e.target.checked)} />
          층화 추출 (Stratified)
        </label>
      )}

      <ActionButton onClick={handleExecute}>모델 학습 실행</ActionButton>
    </div>
  );
}
