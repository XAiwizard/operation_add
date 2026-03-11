import React from 'react';

export default function AccordionGroup({ title, groupId, activeGroup, onToggle, children }) {
  const isOpen = activeGroup === groupId;

  const handleClick = () => {
    onToggle(isOpen ? null : groupId);
  };

  return (
    <div className="accordion-item">
      <div
        className={`accordion-header${isOpen ? ' active' : ''}`}
        onClick={handleClick}
      >
        {title}
        <span className="arrow">{isOpen ? '▼' : '▶'}</span>
      </div>
      <div className={`accordion-body${isOpen ? ' open' : ''}`}>
        {children}
      </div>
    </div>
  );
}
