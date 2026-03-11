import React, { useState } from 'react';

const MOCK_MODELS = [
  { id: 'M001', name: '수요예측_LinearReg_v3', type: 'Linear Regression', status: 'deployed', accuracy: '0.847', created: '2024-01-15', schedule: '매일 09:00', lastRun: '2024-01-23 09:00', nextRun: '2024-01-24 09:00' },
  { id: 'M002', name: '이탈예측_RF_v2', type: 'Random Forest', status: 'deployed', accuracy: '0.912', created: '2024-01-10', schedule: '매주 월요일', lastRun: '2024-01-22 06:00', nextRun: '2024-01-29 06:00' },
  { id: 'M003', name: '품질분류_DT_v1', type: 'Decision Tree', status: 'stopped', accuracy: '0.783', created: '2024-01-05', schedule: '-', lastRun: '2024-01-20 12:00', nextRun: '-' },
  { id: 'M004', name: '고장예측_KNN_v4', type: 'KNN', status: 'deployed', accuracy: '0.856', created: '2024-01-18', schedule: '매 6시간', lastRun: '2024-01-23 06:00', nextRun: '2024-01-23 12:00' },
  { id: 'M005', name: '센서이상탐지_SVM_v1', type: 'SVM', status: 'testing', accuracy: '0.901', created: '2024-01-20', schedule: '-', lastRun: '-', nextRun: '-' },
];

const STATUS_BADGE = { deployed: { cls: 'bg', text: '운영중' }, stopped: { cls: 'bb', text: '중지' }, testing: { cls: 'bw', text: '테스트' } };

export default function OperationsPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? MOCK_MODELS : MOCK_MODELS.filter(m => m.status === filter);

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2c3e50' }}>📋 AI 운영소</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['all', '전체'], ['deployed', '운영중'], ['stopped', '중지'], ['testing', '테스트']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding: '6px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem',
                background: filter === v ? '#3498db' : '#ecf0f1', color: filter === v ? '#fff' : '#555' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {filtered.map(m => {
          const st = STATUS_BADGE[m.status];
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: '18px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,.06)', border: '1px solid #eee',
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2c3e50' }}>{m.name}</span>
                  <span className={`badge ${st.cls}`}>{st.text}</span>
                  <span style={{ fontSize: '.8rem', color: '#95a5a6' }}>{m.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 20, fontSize: '.85rem', color: '#7f8c8d' }}>
                  <span>정확도: <b style={{ color: '#2c3e50' }}>{m.accuracy}</b></span>
                  <span>생성: {m.created}</span>
                  <span>스케줄: {m.schedule}</span>
                  <span>마지막 실행: {m.lastRun}</span>
                  <span>다음 실행: {m.nextRun}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ padding: '6px 14px', border: '1px solid #3498db', background: 'none', borderRadius: 5, color: '#3498db', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>상세보기</button>
                {m.status === 'deployed' && (
                  <button style={{ padding: '6px 14px', border: '1px solid #e74c3c', background: 'none', borderRadius: 5, color: '#e74c3c', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>중지</button>
                )}
                {m.status === 'stopped' && (
                  <button style={{ padding: '6px 14px', border: '1px solid #2ecc71', background: 'none', borderRadius: 5, color: '#2ecc71', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem' }}>시작</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, background: '#eaf6ff', borderLeft: '4px solid #3498db', padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: '.88rem', color: '#004085' }}>
        총 {MOCK_MODELS.length}개 모델 | 운영중 {MOCK_MODELS.filter(m => m.status === 'deployed').length}개 | 중지 {MOCK_MODELS.filter(m => m.status === 'stopped').length}개 | 테스트 {MOCK_MODELS.filter(m => m.status === 'testing').length}개
      </div>
    </div>
  );
}
