import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLog } from '../../contexts/LogContext';
import AccordionGroup from './AccordionGroup';
// Feature Store moved to dedicated page

const PREPROCESS_ITEMS = [
  { id: 'delete_column', label: '컬럼 삭제' },
  { id: 'missing_value', label: '결측치 처리' },
  { id: 'scaling', label: '스케일링 (Scaling)' },
  { id: 'encoding', label: '인코딩' },
  { id: 'data_type_conversion', label: '데이터 형변환' },
  { id: 'matrix_transpose', label: '행렬 전치' },
];

const EDA_ITEMS = [
  { id: 'statistics', label: '기술 통계' },
  { id: 'line_chart', label: '꺾은선 차트' },
  { id: 'histogram', label: '히스토그램' },
  { id: 'pie_chart', label: '파이 차트' },
  { id: 'bar_chart', label: '막대 차트' },
  { id: 'scatter_plot', label: '산포 차트' },
  { id: 'boxplot', label: '박스플롯' },
  { id: 'correlation', label: '상관분석' },
];

const MODEL_ITEMS = [
  { id: 'linear_reg', label: 'Linear Regression' },
  { id: 'logistic_reg', label: 'Logistic Regression' },
  { id: 'dt', label: 'Decision Tree' },
  { id: 'kmeans', label: 'K-means' },
  { id: 'svm', label: 'SVM' },
  { id: 'random_forest', label: 'Random Forest' },
  { id: 'pca', label: 'PCA' },
  { id: 'mlr', label: 'MLR' },
  { id: 'knn', label: 'KNN' },
];

export default function Sidebar({ selectedFunction, onSelectFunction }) {
  const [activeGroup, setActiveGroup] = useState('data');
  const { setData, setFileName } = useData();
  const { addLog } = useLog();
  const fileInputRef = useRef(null);

  const handleFileChange = () => {
    const f = fileInputRef.current;
    if (f && f.files.length > 0) {
      addLog(`파일 선택: ${f.files[0].name}`);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return null;
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = lines.slice(1).map(line => {
      const vals = [];
      let cur = '', inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      vals.push(cur.trim());
      return vals.map(v => {
        if (v === '' || v === 'null' || v === 'NA' || v === 'NaN') return null;
        const n = Number(v);
        return isNaN(n) ? v : n;
      });
    });
    const types = headers.map((_, ci) => {
      const sample = data.slice(0, 20).map(r => r[ci]).filter(v => v != null);
      if (sample.every(v => typeof v === 'number')) {
        return sample.every(v => Number.isInteger(v)) ? 'int' : 'float';
      }
      return 'str';
    });
    return { headers, types, data };
  };

  const handleUpload = () => {
    const f = fileInputRef.current;
    if (!f || !f.files.length) { addLog('[경고] 파일을 먼저 선택하세요.', 'warn'); return; }
    const file = f.files[0];
    const name = file.name;
    if (name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = parseCSV(e.target.result);
        if (result) {
          setData(result.headers, result.types, result.data, name);
          addLog(`[로드 완료] ${name} (${result.data.length}행 × ${result.headers.length}열)`, 'success');
        } else {
          addLog('[오류] CSV 파싱 실패', 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      // For xlsx, just set filename (backend processing needed)
      setFileName(name);
      addLog(`[알림] ${name} — xlsx 파일은 백엔드를 통해 로드됩니다.`, 'warn');
    }
  };

  const handleMenuClick = (id) => {
    onSelectFunction(id);
    addLog(`${id} 선택`);
  };

  return (
    <nav className="sidebar">
      <AccordionGroup
        title="데이터 관리"
        groupId="data"
        activeGroup={activeGroup}
        onToggle={setActiveGroup}
      >
        <div className="sidebar-form">
          <label className="sidebar-label">로컬 파일 (.xlsx, .csv)</label>
          <input
            type="file"
            ref={fileInputRef}
            className="sidebar-input"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
          />
          <button className="sidebar-btn" onClick={handleUpload}>데이터 로드</button>
        </div>
      </AccordionGroup>

      <AccordionGroup
        title="전처리"
        groupId="preprocess"
        activeGroup={activeGroup}
        onToggle={setActiveGroup}
      >
        {PREPROCESS_ITEMS.map(item => (
          <button
            key={item.id}
            className={`menu-btn${selectedFunction === item.id ? ' active-func' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </AccordionGroup>

      <AccordionGroup
        title="탐색적 분석 (EDA)"
        groupId="eda"
        activeGroup={activeGroup}
        onToggle={setActiveGroup}
      >
        {EDA_ITEMS.map(item => (
          <button
            key={item.id}
            className={`menu-btn${selectedFunction === item.id ? ' active-func' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </AccordionGroup>

      <AccordionGroup
        title="모델링"
        groupId="model"
        activeGroup={activeGroup}
        onToggle={setActiveGroup}
      >
        {MODEL_ITEMS.map(item => (
          <button
            key={item.id}
            className={`menu-btn${selectedFunction === item.id ? ' active-func' : ''}`}
            onClick={() => handleMenuClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </AccordionGroup>
    </nav>
  );
}
