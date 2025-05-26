const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/auth');

// Использование переменной окружения для JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ВНИМАНИЕ: JWT_SECRET не задан в переменных окружения');
}

/**
 * @route POST /api/auth/register
 * @desc Регистрация нового пользователя
 * @access Public
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Валидация входных данных
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }
  
  // Проверка валидности email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Некорректный формат email' });
  }
  
  // Проверка валидности роли
  const validRoles = ['teacher', 'student', 'parent'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Некорректная роль пользователя' });
  }

  try {
    // Проверка существования пользователя
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Хеширование пароля и создание пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, role',
      [name, email, hashedPassword, role]
    );

    // Создание JWT токена
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

/**
 * @route POST /api/auth/login
 * @desc Аутентификация пользователя
 * @access Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Валидация входных данных
  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  try {
    // Поиск пользователя
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Проверка пароля
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      token, 
      role: user.rows[0].role,
      id: user.rows[0].id,
      name: user.rows[0].name
    });
  } catch (err) {
    console.error('Ошибка логина:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * @route GET /api/auth/classes
 * @desc Получение списка классов
 * @access Private (только для учителей)
 */
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

/**
 * @route POST /api/auth/students
 * @desc Регистрация ученика
 * @access Private (только для учителей)
 */
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

/**
 * @route GET /api/auth/students
 * @desc Получение списка учеников
 * @access Private (только для учителей)
 */
router.get('/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  try {
    const students = await pool.query(
      'SELECT s.id, u.name, u.id as user_id, s.class_id FROM students s JOIN users u ON s.user_id = u.id'
    );
    res.json(students.rows);
  } catch (err) {
    console.error('Ошибка загрузки учеников:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/**
 * @route POST /api/auth/parents
 * @desc Регистрация родителя с детьми
 * @access Private (только для учителей)
 */
router.post('/parents', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ только для учителей' });
  }

  const { parent_id, student_ids } = req.body;
  if (!parent_id || !student_ids || !Array.isArray(student_ids)) {
    return res.status(400).json({ message: 'Поля parent_id и student_ids обязательны' });
  }

  try {
    // Используем транзакцию для обеспечения целостности данных
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const studentId of student_ids) {
        await client.query(
          'INSERT INTO parents (parent_id, student_id) VALUES ($1, $2)',
          [parent_id, studentId]
        );
      }
      
      await client.query('COMMIT');
      res.status(201).json({ message: 'Родитель успешно привязан к детям' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Ошибка привязки родителя к детям:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;