import React from 'react';
import { useData } from '../../../contexts/DataContext';
import useDataOperations from '../../../hooks/useDataOperations';
import Tooltip from '../../shared/Tooltip';
import InfoBox from '../../shared/InfoBox';
import ActionButton from '../../shared/ActionButton';

export default function TransposeControl() {
  const { columns, rows } = useData();
  const { execTranspose } = useDataOperations();

  return (
    <div>
      <InfoBox>
        데이터의 행↔열을 뒤바꿉니다. <Tooltip text="행과 열이 교환됩니다." />
      </InfoBox>

      <div style={{ background: '#f8f9fa', padding: 10, borderRadius: 6, fontSize: '0.85rem', marginBottom: 10 }}>
        현재: <strong>{rows.length}행 × {columns.length}열</strong><br />
        전치 후: <strong>{columns.length}행 × {Math.min(rows.length + 1, 31)}열</strong>
      </div>

      <ActionButton onClick={execTranspose}>
        전치 실행
      </ActionButton>
    </div>
  );
}
