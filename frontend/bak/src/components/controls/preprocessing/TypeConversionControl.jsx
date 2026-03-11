import React, { useState } from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';
import ActionButton from '../../shared/ActionButton';

const TYPES = [
  { value: 'int', label: '정수 (int)' },
  { value: 'float', label: '실수 (float)' },
  { value: 'str', label: '문자열 (str)' },
  { value: 'datetime', label: '날짜 (datetime)' },
  { value: 'bool', label: '불리언 (bool)' },
  { value: 'category', label: '범주형 (category)' },
];

export default function TypeConversionControl() {
  const { columns, types } = useData();
  const { execTypeConversion } = useDataOperations();
  const [col, setCol] = useState(columns[0] || '');
  const [targetType, setTargetType] = useState('int');
  const [dateFormat, setDateFormat] = useState('%Y-%m-%d');

  const colOptions = columns.map((c, i) => ({
    value: c, label: `${c} (${types[i]})`
  }));

  return (
    <div>
      <InfoBox>컬럼의 데이터 타입을 변경합니다.</InfoBox>

      <FormSelect
        label="대상 컬럼"
        tooltip="형변환할 컬럼. 괄호 안은 현재 타입."
        value={col}
        onChange={setCol}
        options={colOptions}
      />

      <FormSelect
        label="변환 타입"
        tooltip="int: 정수, float: 실수, str: 문자열, datetime: 날짜, bool: 참/거짓, category: 범주"
        value={targetType}
        onChange={setTargetType}
        options={TYPES}
      />

      {targetType === 'datetime' && (
        <FormInput
          label="날짜 포맷"
          tooltip="Python strftime 형식. 예: %Y-%m-%d, %Y/%m/%d %H:%M"
          type="text"
          value={dateFormat}
          onChange={setDateFormat}
          placeholder="%Y-%m-%d"
        />
      )}

      <ActionButton onClick={() => execTypeConversion(col, targetType, dateFormat)}>
        형변환 적용
      </ActionButton>
    </div>
  );
}
