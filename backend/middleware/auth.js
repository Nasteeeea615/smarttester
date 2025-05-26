/**
 * Middleware для проверки JWT токена
 * @module middleware/auth
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Проверяет JWT токен в заголовке Authorization
 * @param {Object} req - Express request объект
 * @param {Object} res - Express response объект
 * @param {Function} next - Express next middleware функция
 * @returns {void}
 */
const authenticateToken = (req, res, next) => {
  // Получаем заголовок авторизации
  const authHeader = req.headers['authorization'];
  // Извлекаем токен из формата "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    // Проверяем наличие секретного ключа
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не определён в переменных окружения');
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Добавляем информацию о пользователе в объект запроса
    req.user = decoded;
    next();
  } catch (err) {
    // В продакшн режиме не показываем детали ошибки клиенту
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Недействительный токен' 
      : err.message;
    
    return res.status(403).json({ message: 'Недействительный токен', error: errorMessage });
  }
};

module.exports = authenticateToken;