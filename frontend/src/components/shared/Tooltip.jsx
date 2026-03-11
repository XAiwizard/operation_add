import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef();

  const handleEnter = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const tipW = 240;
    // 아이콘 아래쪽에 표시, 좌우 화면 밖으로 나가지 않도록 조정
    let left = rect.left + rect.width / 2 - tipW / 2;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    setPos({ top: rect.bottom + 8, left });
    setShow(true);
  }, []);

  const handleLeave = useCallback(() => setShow(false), []);

  return (
    <>
      <span
        ref={ref}
        className="tip"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        ⓘ
      </span>
      {show && createPortal(
        <div style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: 240,
          background: '#2c3e50',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: '0.8rem',
          fontWeight: 400,
          lineHeight: 1.45,
          zIndex: 99999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          textAlign: 'left',
          wordBreak: 'keep-all',
          whiteSpace: 'normal',
          pointerEvents: 'none',
        }}>
          {text}
        </div>,
        document.body
      )}
    </>
  );
}
