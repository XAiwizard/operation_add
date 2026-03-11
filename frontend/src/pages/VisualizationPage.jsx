import React from 'react';

const QLIK_DASHBOARDS = [
  { id: 1, title: '수요 예측 분석', desc: '수리부속 수요 예측 결과 시각화', url: '#', icon: '📈' },
  { id: 2, title: '고객 이탈 예측', desc: '고객 이탈 확률 및 주요 요인 분석', url: '#', icon: '👥' },
  { id: 3, title: '장비 고장 예측', desc: '설비 예지보전 모니터링', url: '#', icon: '🔧' },
  { id: 4, title: '품질 분류 결과', desc: '제품 품질 판정 결과 분석', url: '#', icon: '✅' },
  { id: 5, title: '재고 최적화', desc: '자재 재고 수준 최적화 현황', url: '#', icon: '📦' },
  { id: 6, title: '센서 이상 탐지', desc: 'IoT 센서 실시간 이상 탐지', url: '#', icon: '🌡️' },
  { id: 7, title: '모델 성능 비교', desc: '모델간 정확도 비교 대시보드', url: '#', icon: '📊' },
  { id: 8, title: '운영 모니터링', desc: '배포 모델 실시간 운영 현황', url: '#', icon: '🖥️' },
];

export default function VisualizationPage() {
  const handleClick = (dashboard) => {
    if (dashboard.url === '#') {
      alert(`"${dashboard.title}" Qlik Sense 대시보드로 이동합니다.\n(인트라넷 URL 연동 후 사용 가능)`);
    } else {
      window.open(dashboard.url, '_blank');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', background: '#fff', flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#2c3e50' }}>모델 결과 시각화</h1>
        <p style={{ margin: '4px 0 0', fontSize: '.85rem', color: '#7f8c8d' }}>
          Qlik Sense 대시보드 바로가기 — 클릭 시 해당 시각화 페이지로 이동합니다.
        </p>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#f0f2f5' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          {QLIK_DASHBOARDS.map(db => (
            <div
              key={db.id}
              onClick={() => handleClick(db)}
              style={{
                background: '#fff',
                border: '2px solid #e0e0e0',
                borderRadius: 14,
                padding: '32px 20px',
                cursor: 'pointer',
                transition: 'all .2s',
                textAlign: 'center',
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3498db'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(52,152,219,.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{db.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#2c3e50', marginBottom: 6 }}>{db.title}</div>
              <div style={{ fontSize: '.82rem', color: '#7f8c8d', lineHeight: 1.4 }}>{db.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
