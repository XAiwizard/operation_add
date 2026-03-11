import React, { useEffect, useRef } from 'react';
import { useLog } from '../../contexts/LogContext';

export default function ActionLog() {
  const { logs, clearLog } = useLog();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="result-panel" ref={scrollRef}>
      <div className="result-header">
        <span>📜 실행 로그</span>
        <button
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
          onClick={clearLog}
        >
          🧹
        </button>
      </div>
      <div style={{ padding: 8 }}>
        {logs.map((log, i) => (
          <div key={i} className="log-item">
            <span className="log-time">{log.time}</span>
            <span className={`log-${log.type}`}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
