import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import SmartProcessUpdater from './components/importer/SmartProcessUpdater';
import ParseSite from './components/parser/parseSite';
import ParserPage from './components/parser/ParserPage';

import './App.css';
import './styles.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/importer" replace />} />
        <Route path="importer" element={<SmartProcessUpdater />} />      
        <Route path="parser" element={<ParserPage />} />
        <Route path="parseSite" element={<ParseSite />} />        
        <Route path="*" element={<h2 style={{ padding: '2rem' }}>Ресурс не найден</h2>} />
      </Route>
    </Routes>
  );
}