import React from 'react';

export default function ActionButton({ children, onClick, variant = 'primary', disabled = false }) {
  const cls = variant === 'danger' ? 'btn-action btn-danger'
    : variant === 'success' ? 'btn-action btn-success'
    : 'btn-action';

  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
