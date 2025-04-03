import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'react-mathquill/lib/mathquill.css'; // Добавляем стили MathQuill

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);