import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { LogProvider } from './contexts/LogContext';
import { ProjectProvider } from './contexts/ProjectContext';
import NavBar from './components/layout/NavBar';
import HomePage from './pages/HomePage';
import FactoryPage from './pages/FactoryPage';
import OperationsPage from './pages/OperationsPage';
import FeatureStorePage from './pages/FeatureStorePage';
import VisualizationPage from './pages/VisualizationPage';

function App() {
  return (
    <DataProvider>
      <LogProvider>
        <ProjectProvider>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/factory" element={<FactoryPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/feature-store" element={<FeatureStorePage />} />
            <Route path="/visualization" element={<VisualizationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProjectProvider>
      </LogProvider>
    </DataProvider>
  );
}

export default App;
