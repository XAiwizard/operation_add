import React from 'react';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { title: 'AI 제작소', desc: '노코딩 방식의 머신러닝 AI 모델 개발', path: '/factory', icon: '🏭' },
  { title: 'AI 운영소', desc: '개발된 모델의 운영 및 스케줄링 관리', path: '/operations', icon: '📋' },
  { title: '데이터 저장소', desc: '학습용 데이터 목록, 명세, 미리보기', path: '/feature-store', icon: '📦' },
  { title: '모델 시각화', desc: '모델 결과 분석 시각화 대시보드', path: '/visualization', icon: '📊' },
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <h1>XAI Wizard</h1>
      <div className="menu-grid">
        {menuItems.map(item => (
          <div key={item.path} className="menu-card" onClick={() => navigate(item.path)}>
            <span className="menu-icon">{item.icon}</span>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
