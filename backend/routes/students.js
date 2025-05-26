const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Регистрация ученика (доступно только учителям)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const { user_id, class_id } = req.body;
    if (!user_id || !class_id) {
      return res.status(400).json({ message: 'Поля user_id и class_id обязательны' });
    }

    const newStudent = await pool.query(
      'INSERT INTO students (user_id, class_id) VALUES ($1, $2) RETURNING *',
      [user_id, class_id]
    );
    res.status(201).json(newStudent.rows[0]);
  } catch (err) {
    console.error('Ошибка при регистрации ученика:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение списка учеников в классе (для учителя)
router.get('/class/:class_id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const classId = req.params.class_id;
    const students = await pool.query(
      'SELECT s.id, s.user_id, u.name, u.email, s.class_id, s.created_at ' +
      'FROM students s JOIN users u ON s.user_id = u.id WHERE s.class_id = $1',
      [classId]
    );
    res.json(students.rows);
  } catch (err) {
    console.error('Ошибка при загрузке учеников:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;