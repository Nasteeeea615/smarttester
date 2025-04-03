const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Заголовок Authorization:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Извлечённый токен:', token);
  if (!token) return res.status(401).json({ message: 'Токен отсутствует' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Ошибка проверки токена:', err);
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Получение тестов учителя
router.get('/teacher', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const tests = await pool.query(
      'SELECT tests.*, classes.name as class_name FROM tests JOIN classes ON tests.class_id = classes.id WHERE teacher_id = $1',
      [teacherId]
    );
    res.json(tests.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение вопросов теста
router.get('/:id/questions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1 AND teacher_id = $2', [
      id,
      req.user.id,
    ]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или доступ запрещён' });
    }

    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1', [id]);
    res.json(questions.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение тестов для ученика
router.get('/student', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const userResult = await pool.query('SELECT class_id FROM users WHERE id = $1', [studentId]);
    const classId = userResult.rows[0]?.class_id;

    if (!classId) {
      return res.status(400).json({ message: 'У ученика не указан класс' });
    }

    const tests = await pool.query(
      'SELECT tests.*, classes.name as class_name FROM tests JOIN classes ON tests.class_id = classes.id WHERE tests.class_id = $1',
      [classId]
    );
    res.json(tests.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание теста
router.post('/', authenticateToken, upload.array('images'), async (req, res) => {
  try {
    const { title, class_id, questions } = req.body;
    const parsedQuestions = JSON.parse(questions);
    const teacher_id = req.user.id;

    const testResult = await pool.query(
      'INSERT INTO tests (title, teacher_id, class_id) VALUES ($1, $2, $3) RETURNING *',
      [title, teacher_id, class_id]
    );
    const testId = testResult.rows[0].id;

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      let image_url = null;
      if (req.files && req.files[i]) {
        image_url = `/uploads/${req.files[i].filename}`;
      }
      await pool.query(
        'INSERT INTO questions (test_id, question_text, options, correct_answer, correct_answers, type, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          testId,
          q.question_text,
          q.options,
          q.type === 'single' ? q.correct_answer : null,
          q.type === 'multiple' ? q.correct_answers : null,
          q.type,
          image_url,
        ]
      );
    }

    res.status(201).json({ message: 'Тест создан' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновление теста
router.put('/:id', authenticateToken, upload.array('images'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, class_id, questions } = req.body;
    const parsedQuestions = JSON.parse(questions);

    await pool.query('UPDATE tests SET title = $1, class_id = $2 WHERE id = $3', [
      title,
      class_id,
      id,
    ]);

    await pool.query('DELETE FROM questions WHERE test_id = $1', [id]);

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      let image_url = q.image_url || null;
      if (req.files && req.files[i]) {
        image_url = `/uploads/${req.files[i].filename}`;
      }
      await pool.query(
        'INSERT INTO questions (test_id, question_text, options, correct_answer, correct_answers, type, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          id,
          q.question_text,
          q.options,
          q.type === 'single' ? q.correct_answer : null,
          q.type === 'multiple' ? q.correct_answers : null,
          q.type,
          image_url,
        ]
      );
    }

    res.json({ message: 'Тест обновлён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удаление теста
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1 AND teacher_id = $2', [
      id,
      req.user.id,
    ]);

    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или доступ запрещён' });
    }

    await pool.query('DELETE FROM questions WHERE test_id = $1', [id]);
    await pool.query('DELETE FROM tests WHERE id = $1', [id]);

    res.json({ message: 'Тест удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;