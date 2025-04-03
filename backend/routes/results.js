const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Отправка результатов теста
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }

  const { test_id, answers } = req.body;
  const studentId = req.user.userId;

  try {
    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1', [test_id]);
    let score = 0;
    const total = questions.rows.length;

    questions.rows.forEach((question) => {
      const userAnswer = answers[question.id];
      if (question.type === 'single') {
        if (userAnswer === question.correct_answer) {
          score++;
        }
      } else {
        const correctAnswers = question.correct_answers || [];
        const userAnswers = userAnswer || [];
        if (
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((ans) => userAnswers.includes(ans))
        ) {
          score++;
        }
      }
    });

    await pool.query(
      'INSERT INTO test_results (test_id, student_id, score, total) VALUES ($1, $2, $3, $4)',
      [test_id, studentId, score, total]
    );

    res.json({ score, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение результатов для родителей
router.get('/parent', authenticateToken, async (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }

  try {
    const children = await pool.query(
      'SELECT child_id FROM parent_child WHERE parent_id = $1',
      [req.user.userId]
    );
    const childIds = children.rows.map((child) => child.child_id);

    if (childIds.length === 0) {
      return res.json([]);
    }

    const results = await pool.query(
      'SELECT tr.*, t.title, u.name AS student_name FROM test_results tr JOIN tests t ON tr.test_id = t.id JOIN users u ON tr.student_id = u.id WHERE tr.student_id = ANY($1::int[])',
      [childIds]
    );

    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;