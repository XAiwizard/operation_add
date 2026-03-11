import React, { useState, useRef, useEffect } from 'react';

export default function ColumnCheckboxList({ columns, name, checked = false, onChange }) {
  const [selected, setSelected] = useState(() =>
    checked ? [...columns] : []
  );
  // Track columns by joined value to avoid resetting on every parent re-render
  const prevColsRef = useRef(columns.join('|'));

  useEffect(() => {
    const key = columns.join('|');
    if (key !== prevColsRef.current) {
      prevColsRef.current = key;
      const next = checked ? [...columns] : [];
      setSelected(next);
    }
    // eslint-disable-next-line
  }, [columns, checked]);

  const toggle = (col) => {
    setSelected(prev => {
      const next = prev.includes(col)
        ? prev.filter(c => c !== col)
        : [...prev, col];
      if (onChange) onChange(next);
      return next;
    });
  };

  const selectAll = () => {
    setSelected([...columns]);
    if (onChange) onChange([...columns]);
  };

  const deselectAll = () => {
    setSelected([]);
    if (onChange) onChange([]);
  };

  return (
    <div>
      <div className="select-actions">
        <button type="button" onClick={selectAll}>전체 선택</button>
        <button type="button" onClick={deselectAll}>전체 해제</button>
      </div>
      <div className="var-list">
        {columns.map(col => (
          <label key={col} className="var-item">
            <input
              type="checkbox"
              name={name}
              value={col}
              checked={selected.includes(col)}
              onChange={() => toggle(col)}
            />
            {col}
          </label>
        ))}
      </div>
    </div>
  );
}
