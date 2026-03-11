import React from 'react';
import Tooltip from './Tooltip';

export default function FormInput({ label, tooltip, type = 'number', value, onChange, min, max, step, placeholder, id }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
      )}
      <input
        className="form-input"
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
    </div>
  );
}
