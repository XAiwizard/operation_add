import React from 'react';
import { useData } from '../../contexts/DataContext';

export default function DataTable() {
  const { columns, rows, fileName } = useData();

  return (
    <main className="main-content">
      <div className="panel-box">
        <div className="panel-header">
          <span>데이터: {fileName}</span>
          <small style={{ color: '#7f8c8d' }}>
            {rows.length.toLocaleString()} Rows × {columns.length} Columns
          </small>
        </div>
        <div className="data-grid-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      {cell === null || cell === undefined
                        ? <span style={{ color: '#e74c3c', fontStyle: 'italic' }}>NaN</span>
                        : String(cell)
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
