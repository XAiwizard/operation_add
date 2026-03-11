import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: '홈' },
  { to: '/factory', label: 'AI 제작소' },
  { to: '/operations', label: 'AI 운영소' },
  { to: '/feature-store', label: '데이터 저장소' },
  { to: '/visualization', label: '모델 시각화' },
];

export default function NavBar() {
  return (
    <nav className="top-nav">
      <div className="brand"><span>XAI Wizard</span></div>
      <div className="nav-links">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="user-info"></div>
    </nav>
  );
}
