const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Назначение теста классу или ученику (доступно только учителям)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const { test_id, class_id, student_id } = req.body;
    if (!test_id || (!class_id && !student_id)) {
      return res.status(400).json({ message: 'Поля test_id и одно из class_id или student_id обязательны' });
    }

    const assignment = await pool.query(
      'INSERT INTO test_assignments (test_id, class_id, student_id) VALUES ($1, $2, $3) RETURNING *',
      [test_id, class_id || null, student_id || null]
    );
    res.status(201).json(assignment.rows[0]);
  } catch (err) {
    console.error('Ошибка при назначении теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение доступных тестов для ученика
router.get('/available', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Доступ разрешён только ученикам' });
    }

    const userId = req.user.id;
    const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    const studentId = student.rows[0].id;
    const classId = student.rows[0].class_id;

    const tests = await pool.query(
      'SELECT DISTINCT t.* FROM tests t ' +
      'JOIN test_assignments ta ON t.id = ta.test_id ' +
      'WHERE ta.class_id = $1 OR ta.student_id = $2',
      [classId, studentId]
    );

    // Исключаем тесты, которые ученик уже сдал
    const submittedTests = await pool.query(
      'SELECT test_id FROM student_submissions WHERE student_id = $1',
      [studentId]
    );
    const submittedTestIds = submittedTests.rows.map(row => row.test_id);
    const availableTests = tests.rows.filter(test => !submittedTestIds.includes(test.id));

    res.json(availableTests);
  } catch (err) {
    console.error('Ошибка при загрузке доступных тестов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение результатов ученика
router.get('/results', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Доступ разрешён только ученикам' });
    }

    const userId = req.user.id;
    const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    const studentId = student.rows[0].id;
    const submissions = await pool.query(
      'SELECT ss.*, t.title as test_title FROM student_submissions ss ' +
      'JOIN tests t ON ss.test_id = t.id WHERE ss.student_id = $1',
      [studentId]
    );
    res.json(submissions.rows);
  } catch (err) {
    console.error('Ошибка при загрузке результатов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;