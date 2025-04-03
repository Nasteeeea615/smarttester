const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

// Регистрация
router.post('/register', async (req, res) => {
  const { name, email, password, role, class_id, children } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Все поля (name, email, password, role) обязательны' });
  }

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, role === 'student' ? class_id : null]
    );

    const userId = newUser.rows[0].id;

    if (role === 'parent' && children && children.length > 0) {
      for (const childId of children) {
        await pool.query('INSERT INTO parent_child (parent_id, child_id) VALUES ($1, $2)', [userId, childId]);
      }
    }

    const token = jwt.sign(
      { id: userId, role, class_id: role === 'student' ? class_id : null },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, class_id: user.class_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение классов
router.get('/classes', async (req, res) => {
  try {
    const classes = await pool.query('SELECT * FROM classes');
    res.json(classes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение учеников
router.get('/students', async (req, res) => {
  try {
    const students = await pool.query("SELECT id, name FROM users WHERE role = 'student'");
    res.json(students.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;