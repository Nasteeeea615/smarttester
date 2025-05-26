const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Регистрация пользователя
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, role',
      [name, email, hashedPassword, role]
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, role: newUser.rows[0].role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({ token, id: newUser.rows[0].id });
  } catch (err) {
    console.error('Ошибка регистрации:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Логин пользователя
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, role: user.rows[0].role });
  } catch (err) {
    console.error('Ошибка логина:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка классов
router.get('/classes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  try {
    const classes = await pool.query('SELECT id, name FROM classes');
    res.json(classes.rows);
  } catch (err) {
    console.error('Ошибка загрузки классов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Регистрация ученика
router.post('/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  const { user_id, class_id } = req.body;
  if (!user_id || !class_id) {
    return res.status(400).json({ message: 'Поля user_id и class_id обязательны' });
  }

  try {
    const newStudent = await pool.query(
      'INSERT INTO students (user_id, class_id) VALUES ($1, $2) RETURNING *',
      [user_id, class_id]
    );
    res.status(201).json(newStudent.rows[0]);
  } catch (err) {
    console.error('Ошибка регистрации ученика:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение списка учеников
router.get('/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  try {
    const students = await pool.query(
      'SELECT s.id, u.name FROM students s JOIN users u ON s.user_id = u.id'
    );
    res.json(students.rows);
  } catch (err) {
    console.error('Ошибка загрузки учеников:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Регистрация родителя с детьми
router.post('/parents', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  const { name, email, password, children } = req.body;
  if (!name || !email || !password || !children || !Array.isArray(children)) {
    return res.status(400).json({ message: 'Все поля обязательны, children должен быть массивом' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newParent = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'parent']
    );

    const parentId = newParent.rows[0].id;
    const insertPromises = children.map((childId) =>
      pool.query('INSERT INTO parents_students (parent_id, student_id) VALUES ($1, $2)', [parentId, childId])
    );
    await Promise.all(insertPromises);

    res.status(201).json({ message: 'Родитель зарегистрирован', parent_id: parentId });
  } catch (err) {
    console.error('Ошибка регистрации родителя:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;