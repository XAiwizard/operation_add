import React, { useState } from 'react';
import { FEATURE_STORE_DATA } from '../utils/constants';

export default function FeatureStorePage() {
  const [selected, setSelected] = useState(null);

  const ds = selected != null ? FEATURE_STORE_DATA[selected] : null;

  const downloadCSV = () => {
    if (!ds) return;
    const header = ds.headers.join(',');
    const body = ds.data.map(row => row.join(',')).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', background: '#fff', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#2c3e50' }}>학습용 데이터 저장소</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', flex: 1, minHeight: 0 }}>
        {/* Fixed-width Dataset list */}
        <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', padding: 16, background: '#f8f9fa' }}>
          {FEATURE_STORE_DATA.map((d, i) => (
            <div key={d.id}
              onClick={() => setSelected(i)}
              style={{
                background: selected === i ? '#e8f8f5' : '#fff',
                border: `2px solid ${selected === i ? '#2ecc71' : '#e0e0e0'}`,
                borderRadius: 8, padding: 14, marginBottom: 10, cursor: 'pointer',
                transition: 'all .2s',
              }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#2c3e50', marginBottom: 3 }}>
                {d.name}
              </div>
              <div style={{ fontSize: '.8rem', color: '#888', marginBottom: 6 }}>{d.desc}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: '.75rem' }}>
                <span style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 8 }}>
                  {d.rows.toLocaleString()} rows
                </span>
                <span style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 8 }}>
                  {d.cols} cols
                </span>
                <span style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 8 }}>
                  {d.updated}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed detail panel */}
        <div style={{ overflowY: 'auto', padding: 20, background: '#fff' }}>
          {ds ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #2ecc71' }}>
                <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', margin: 0 }}>{ds.name}</h2>
                <button onClick={downloadCSV} style={{
                  padding: '6px 16px', background: '#27ae60', color: '#fff', border: 'none',
                  borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '.82rem'
                }}>
                  CSV 다운로드
                </button>
              </div>
              <p style={{ fontSize: '.88rem', color: '#555', marginBottom: 16 }}>{ds.desc}</p>

              <h3 style={{ fontSize: '.92rem', color: '#34495e', marginBottom: 6 }}>테이블 명세</h3>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #eee', borderRadius: 6, marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr>
                      <th style={{ background: '#34495e', color: '#fff', padding: '7px 10px', textAlign: 'left', position: 'sticky', top: 0 }}>#</th>
                      <th style={{ background: '#34495e', color: '#fff', padding: '7px 10px', textAlign: 'left', position: 'sticky', top: 0 }}>컬럼명</th>
                      <th style={{ background: '#34495e', color: '#fff', padding: '7px 10px', textAlign: 'left', position: 'sticky', top: 0 }}>타입</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ds.headers.map((h, i) => {
                      const sample = ds.data[0]?.[i];
                      const type = typeof sample === 'number' ? (Number.isInteger(sample) ? 'INTEGER' : 'FLOAT') : 'VARCHAR';
                      return (
                        <tr key={h} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                          <td style={{ padding: '5px 10px', borderBottom: '1px solid #eee' }}>{i + 1}</td>
                          <td style={{ padding: '5px 10px', borderBottom: '1px solid #eee', fontWeight: 600 }}>{h}</td>
                          <td style={{ padding: '5px 10px', borderBottom: '1px solid #eee' }}>{type}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h3 style={{ fontSize: '.92rem', color: '#34495e', marginBottom: 6 }}>데이터 미리보기 (5행)</h3>
              <div style={{ overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
                <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
                  <thead>
                    <tr>
                      {ds.headers.map(h => (
                        <th key={h} style={{ background: '#34495e', color: '#fff', padding: '6px 10px', position: 'sticky', top: 0, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ds.data.slice(0, 5).map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                        {row.map((v, ci) => (
                          <td key={ci} style={{ padding: '5px 10px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                            {typeof v === 'number' ? v.toLocaleString() : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#95a5a6', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p>좌측에서 데이터셋을 선택하면<br/>테이블 명세와 미리보기를 확인할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
