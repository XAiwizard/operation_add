import React, { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext();

const DEMO_COLUMNS = ['ID','Age','Gender','Income','Credit_Score','Tenure','Balance','NumOfProducts','IsActive','Churn'];
const DEMO_TYPES = ['int','int','str','int','int','int','float','int','int','int'];

function generateDemoData() {
  const genders = ['Male','Female'];
  const rows = [];
  for (let i = 1; i <= 30; i++) {
    rows.push([
      i,
      Math.floor(Math.random()*35)+20,
      genders[Math.floor(Math.random()*2)],
      Math.floor(Math.random()*100000)+30000,
      Math.floor(Math.random()*350)+450,
      Math.floor(Math.random()*10)+1,
      parseFloat((Math.random()*120000).toFixed(2)),
      Math.floor(Math.random()*3)+1,
      Math.round(Math.random()),
      Math.round(Math.random()*0.4)
    ]);
  }
  // Add some null values for demo
  rows[2][3] = null; rows[5][6] = null; rows[8][1] = null;
  rows[12][4] = null; rows[15][3] = null; rows[20][6] = null;
  return rows;
}

export function DataProvider({ children }) {
  const [columns, setColumns] = useState(DEMO_COLUMNS);
  const [types, setTypes] = useState(DEMO_TYPES);
  const [rows, setRows] = useState(() => generateDemoData());
  const [fileName, setFileName] = useState('customer_churn.csv');
  const [isDataLoaded, setIsDataLoaded] = useState(true);

  const setData = useCallback((newColumns, newTypes, newRows, newFileName) => {
    setColumns(newColumns);
    setTypes(newTypes);
    setRows(newRows);
    if (newFileName) setFileName(newFileName);
    setIsDataLoaded(true);
  }, []);

  const updateRows = useCallback((newRows) => {
    setRows(newRows);
  }, []);

  const updateColumnsAndTypes = useCallback((newColumns, newTypes) => {
    setColumns(newColumns);
    setTypes(newTypes);
  }, []);

  const deleteColumns = useCallback((colIndices) => {
    const sorted = [...colIndices].sort((a, b) => b - a);
    setColumns(prev => { const next = [...prev]; sorted.forEach(i => next.splice(i, 1)); return next; });
    setTypes(prev => { const next = [...prev]; sorted.forEach(i => next.splice(i, 1)); return next; });
    setRows(prev => prev.map(row => { const next = [...row]; sorted.forEach(i => next.splice(i, 1)); return next; }));
  }, []);

  const value = {
    columns, types, rows, fileName, isDataLoaded,
    setData, updateRows, updateColumnsAndTypes, deleteColumns,
    setColumns, setTypes, setRows, setFileName,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export default DataContext;
