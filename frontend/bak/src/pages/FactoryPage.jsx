import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLog } from '../contexts/LogContext';
import { useProject } from '../contexts/ProjectContext';
import Sidebar from '../components/factory/Sidebar';
import DataTable from '../components/factory/DataTable';
import RightPanel from '../components/factory/RightPanel';

export default function FactoryPage() {
  const [selectedFunction, setSelectedFunction] = useState(null);
  const { projectName, setProjectName } = useProject();

  const editProjectName = () => {
    const name = prompt('새 프로젝트 이름:', projectName);
    if (name && name.trim()) setProjectName(name.trim());
  };

  return (
    <div className="factory-layout">
      <div className="workspace-container">
        <header className="header">
          <div className="brand"><span>AI 제작소</span></div>
          <div className="project-info-container">
            📂 프로젝트:&nbsp;
            <span className="project-title">{projectName}</span>
            <button className="edit-btn" onClick={editProjectName} title="이름 수정">✏️</button>
          </div>
          <div></div>
        </header>
        <Sidebar selectedFunction={selectedFunction} onSelectFunction={setSelectedFunction} />
        <DataTable />
        <RightPanel selectedFunction={selectedFunction} />
      </div>
    </div>
  );
}
