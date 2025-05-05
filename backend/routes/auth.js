const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'smarttester',
  password: '20na28ST_50',
  port: 5432,
});

router.post('/register', async (req, res) => {
  console.log('Запрос на регистрацию:', req.body); // Отладка
  const { name, email, password, role, class_id, children } = req.body;

  // Проверка, что обязательные поля заполнены
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Все поля (name, email, password, role) обязательны' });
  }

  // Проверка допустимой роли
  const validRoles = ['teacher', 'student', 'parent'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Недопустимая роль' });
  }

  // Проверка class_id для студента
  if (role === 'student' && !class_id) {
    return res.status(400).json({ message: 'Для роли student необходимо указать class_id' });
  }

  // Проверка children для родителя
  if (role === 'parent' && (!children || !Array.isArray(children) || children.length === 0)) {
    return res.status(400).json({ message: 'Для роли parent необходимо указать children' });
  }

  try {
    // Проверка подключения к базе данных
    const testConnection = await pool.query('SELECT NOW()');
    console.log('Подключение к базе успешно:', testConnection.rows);

    // Проверка, существует ли пользователь с таким email
    console.log('Проверка email:', email);
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Хеширование пароля
    console.log('Хеширование пароля...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Пароль хеширован:', hashedPassword);

    // Создание нового пользователя
    console.log('Создание пользователя...');
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, role === 'student' ? class_id : null]
    );

    const user = newUser.rows[0];
    console.log('Пользователь создан:', user);

    // Добавление связи родитель-ребёнок для роли parent
    if (role === 'parent') {
      for (const child_id of children) {
        await pool.query(
          'INSERT INTO parent_children (parent_id, child_id) VALUES ($1, $2)',
          [user.id, child_id]
        );
      }
    }

    // Генерация JWT-токена
    console.log('Генерация токена...');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не определён в переменных окружения');
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, class_id: user.class_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Увеличиваем время действия токена
    );
    console.log('Сгенерированный токен:', token);

    res.status(201).json({ token, role: user.role });
  } catch (err) {
    console.error('Ошибка при регистрации:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  console.log('Запрос на вход:', req.body); // Отладка
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    console.log('Генерация токена для пользователя:', { id: user.id, role: user.role, class_id: user.class_id });
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET не определён в переменных окружения');
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, class_id: user.class_id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Сгенерированный токен:', token);

    res.json({ token, role: user.role });
  } catch (err) {
    console.error('Ошибка при входе:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;