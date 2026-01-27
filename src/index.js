import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './styles.css';
import ParseSite from './components/parser/parseSite';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/parseSite" element={<ParseSite />} />
            <Route path="*" element={<h2>Ресурс не найден</h2>} />
        </Routes>
      </BrowserRouter>
  </React.StrictMode>
);
