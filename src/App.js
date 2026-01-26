// App.js
import React, { useState } from 'react';
import SmartProcessUpdater from './components/importer/SmartProcessUpdater';
import ParserPage from './components/parser/ParserPage'; 
import './App.css'; 
import './styles.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('importer'); 

  return (
    <div className="app-container">
      {/* Боковая панель */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Bitrix24 Tools</h2>
          <p className="sidebar-subtitle">Инструменты для работы</p>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-button ${activeTab === 'importer' ? 'active' : ''}`}
            onClick={() => setActiveTab('importer')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Импорт данных</span>
            {activeTab === 'importer' && <div className="active-indicator"></div>}
          </button>
          
          <button
            className={`nav-button ${activeTab === 'parser' ? 'active' : ''}`}
            onClick={() => setActiveTab('parser')}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-text">Парсер</span>
            {activeTab === 'parser' && <div className="active-indicator"></div>}
          </button>
          
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="avatar">👤</div>
              <div>
                <p className="username">Пользователь</p>
                <p className="user-email">user@example.com</p>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Основное содержимое */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h1>
              {activeTab === 'importer' ? 'Импорт в смарт-процессы' : 'Парсер данных'}
            </h1>
            <p className="page-description">
              {activeTab === 'importer' 
                ? 'Массовое обновление элементов Bitrix24' 
                : 'Анализ и обработка данных'}
            </p>
          </div>
          <div className="header-right">
            <div className="status-badge">
              <span className="status-dot"></span>
              <span>Online</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'importer' ? <SmartProcessUpdater /> : <ParserPage />}
        </div>
      </div>
    </div>
  );
}