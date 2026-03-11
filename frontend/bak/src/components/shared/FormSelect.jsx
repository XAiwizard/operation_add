import React from 'react';
import Tooltip from './Tooltip';

export default function FormSelect({ label, tooltip, value, onChange, options, id }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
      )}
      <select
        className="form-select"
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
