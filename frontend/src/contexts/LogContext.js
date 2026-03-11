import React, { createContext, useContext, useState, useCallback } from 'react';

const LogContext = createContext();

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([
    { time: '--:--:--', message: '[Ready] 시스템 준비 완료', type: 'info' }
  ]);

  const addLog = useCallback((message, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  }, []);

  const clearLog = useCallback(() => {
    const time = new Date().toLocaleTimeString();
    setLogs([{ time, message: '[Cleaned] 로그 초기화', type: 'info' }]);
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLog }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLog must be used within LogProvider');
  return ctx;
}

export default LogContext;
