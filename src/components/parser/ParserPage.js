// ParserPage.js
import React from 'react';
import './ParserPage.css';
import { Link } from 'react-router-dom';

const ParserPage = () => {


  return (
    <div className="parser-container">
      <div className="parser-header">
        <h2>Парсер данных</h2>
        <p>Инструмент для анализа и обработки информации</p>
      </div>

      <div className="parser-cards">
        <div className="parser-card">
          <div className="card-icon">🌐</div>
          <h3>Парсинг сайтов</h3>
          <p>Сбор данных с веб-страниц</p>
          <Link
            to="/parseSite"
            className="card-button"
          >
            Начать
          </Link>
        </div>

        <div className="parser-card">
          <div className="card-icon">📄</div>
          <h3>Обработка документов</h3>
          <p>Анализ PDF, Word, Excel файлов</p>
          <button className="card-button">Начать</button>
        </div>

        <div className="parser-card">
          <div className="card-icon">📊</div>
          <h3>Анализ данных</h3>
          <p>Статистика и визуализация</p>
          <button className="card-button">Начать</button>
        </div>

        <div className="parser-card">
          <div className="card-icon">🔄</div>
          <h3>Трансформация</h3>
          <p>Конвертация форматов данных</p>
          <button className="card-button">Начать</button>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Быстрые действия</h3>
        <div className="action-buttons">
          <button className="action-button">
            <span>📋</span>
            Импорт контактов
          </button>
          <button className="action-button">
            <span>🔗</span>
            Парсинг ссылок
          </button>
          <button className="action-button">
            <span>📧</span>
            Сбор email
          </button>
          <button className="action-button">
            <span>📱</span>
            Телефоны
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParserPage;