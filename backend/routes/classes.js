const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Недействительный токен' });
    req.user = user;
    next();
  });
};

// Получение всех классов (без авторизации)
router.get('/', async (req, res) => {
  try {
    const classes = await pool.query('SELECT * FROM classes');
    res.json(classes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание нового класса (для учителей)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Название класса обязательно' });
  }

  try {
    const newClass = await pool.query(
      'INSERT INTO classes (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(newClass.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;