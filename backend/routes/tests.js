const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get('/teacher', authenticateToken, async (req, res) => {
  try {
    console.log('req.user:', req.user);
    const teacherId = req.user.id;
    console.log('Teacher ID:', teacherId);

    if (isNaN(teacherId)) {
      throw new Error('teacherId должен быть числом, получено: ' + teacherId);
    }

    const tableCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tests')");
    if (!tableCheck.rows[0].exists) {
      console.error('Таблица tests не существует');
      return res.status(500).json({ message: 'Таблица tests не существует' });
    }

    const tests = await pool.query(
      'SELECT tests.*, classes.name as class_name FROM tests LEFT JOIN classes ON tests.class_id = classes.id WHERE teacher_id = $1',
      [teacherId]
    );
    console.log('Tests:', tests.rows);
    res.json(tests.rows);
  } catch (err) {
    console.error('Ошибка при загрузке тестов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

router.post('/', authenticateToken, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const { title, class_id, questions } = req.body;
    console.log('Данные для создания теста:', { title, class_id, questions });

    if (!title || !class_id) {
      return res.status(400).json({ message: 'Поля title и class_id обязательны' });
    }

    const parsedClassId = parseInt(class_id);
    if (isNaN(parsedClassId)) {
      return res.status(400).json({ message: 'class_id должен быть числом' });
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (err) {
      return res.status(400).json({ message: 'Неверный формат questions' });
    }

    const teacherId = req.user.id;

    const newTest = await pool.query(
      'INSERT INTO tests (title, class_id, teacher_id) VALUES ($1, $2, $3) RETURNING *',
      [title, parsedClassId, teacherId]
    );
    const test = newTest.rows[0];
    console.log('Созданный тест:', test);

    const imageFiles = req.files || [];
    const imageMap = {};
    imageFiles.forEach((file) => {
      const match = file.fieldname.match(/images\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        imageMap[index] = `/uploads/${file.filename}`;
      }
    });

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      const imageUrl = imageMap[i] || null;

      await pool.query(
        'INSERT INTO questions (test_id, question_text, type, options, correct_answer, correct_answers, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          test.id,
          q.question_text,
          q.type,
          q.options,
          q.type === 'single' ? q.correct_answer : null,
          q.type === 'multiple' ? q.correct_answers : null,
          imageUrl,
        ]
      );
    }

    res.status(201).json(test);
  } catch (err) {
    console.error('Ошибка при создании теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

router.put('/:id', authenticateToken, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const testId = req.params.id;
    const { title, class_id, questions } = req.body;
    console.log('Данные для обновления теста:', { testId, title, class_id, questions });

    if (!title || !class_id) {
      return res.status(400).json({ message: 'Поля title и class_id обязательны' });
    }

    const parsedClassId = parseInt(class_id);
    if (isNaN(parsedClassId)) {
      return res.status(400).json({ message: 'class_id должен быть числом' });
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (err) {
      return res.status(400).json({ message: 'Неверный формат questions' });
    }

    const teacherId = req.user.id;

    const testCheck = await pool.query('SELECT * FROM tests WHERE id = $1 AND teacher_id = $2', [testId, teacherId]);
    if (testCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Тест не найден или доступ запрещён' });
    }

    const updatedTest = await pool.query(
      'UPDATE tests SET title = $1, class_id = $2 WHERE id = $3 RETURNING *',
      [title, parsedClassId, testId]
    );
    const test = updatedTest.rows[0];

    await pool.query('DELETE FROM questions WHERE test_id = $1', [testId]);

    const imageFiles = req.files || [];
    const imageMap = {};
    imageFiles.forEach((file) => {
      const match = file.fieldname.match(/images\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        imageMap[index] = `/uploads/${file.filename}`;
      }
    });

    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      const imageUrl = imageMap[i] || q.image_url || null;

      await pool.query(
        'INSERT INTO questions (test_id, question_text, type, options, correct_answer, correct_answers, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          test.id,
          q.question_text,
          q.type,
          q.options,
          q.type === 'single' ? q.correct_answer : null,
          q.type === 'multiple' ? q.correct_answers : null,
          imageUrl,
        ]
      );
    }

    res.json(test);
  } catch (err) {
    console.error('Ошибка при обновлении теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const teacherId = req.user.id;

    const test = await pool.query(
      'SELECT tests.*, classes.name as class_name FROM tests LEFT JOIN classes ON tests.class_id = classes.id WHERE tests.id = $1 AND teacher_id = $2',
      [testId, teacherId]
    );

    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или доступ запрещён' });
    }

    res.json(test.rows[0]);
  } catch (err) {
    console.error('Ошибка при загрузке теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

router.get('/:id/questions', authenticateToken, async (req, res) => {
  try {
    const testId = req.params.id;
    const teacherId = req.user.id;

    console.log('Запрос вопросов для теста:', { testId, teacherId }); // Отладка

    // Проверяем, что тест принадлежит учителю
    const testCheck = await pool.query('SELECT * FROM tests WHERE id = $1 AND teacher_id = $2', [testId, teacherId]);
    console.log('Результат проверки теста:', testCheck.rows); // Отладка
    if (testCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или доступ запрещён' });
    }

    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1', [testId]);
    console.log('Найденные вопросы:', questions.rows); // Отладка
    res.json(questions.rows);
  } catch (err) {
    console.error('Ошибка при загрузке вопросов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;