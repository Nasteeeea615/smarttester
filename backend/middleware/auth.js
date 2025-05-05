const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer <token>"

  console.log('Полученный токен:', token); // Отладка
  console.log('JWT_SECRET:', process.env.JWT_SECRET); // Отладка

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не определён в переменных окружения');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Декодированный пользователь:', decoded); // Отладка
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Ошибка проверки токена:', err.message); // Подробная ошибка
    return res.status(403).json({ message: 'Недействительный токен', error: err.message });
  }
};

module.exports = authenticateToken;