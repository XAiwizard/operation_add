import React from 'react';
import ControlPanel from './ControlPanel';
import ActionLog from './ActionLog';

export default function RightPanel({ selectedFunction }) {
  return (
    <aside className="right-panel">
      <ControlPanel selectedFunction={selectedFunction} />
      <ActionLog />
    </aside>
  );
}
