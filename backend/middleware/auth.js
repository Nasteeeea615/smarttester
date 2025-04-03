const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Добавляем информацию о пользователе в req
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Недействительный токен' });
  }
};

module.exports = authenticateToken;