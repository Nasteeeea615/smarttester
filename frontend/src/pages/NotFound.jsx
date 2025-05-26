import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Компонент страницы 404 (Страница не найдена)
 */
function NotFound() {
  return (
    <div className="container text-center mt-4">
      <h1>404 - Страница не найдена</h1>
      <p className="text-secondary">Проверьте URL или вернитесь на главную страницу.</p>
      <Link to="/" className="btn btn-primary mt-3">
        Вернуться на главную
      </Link>
    </div>
  );
}

export default NotFound; 