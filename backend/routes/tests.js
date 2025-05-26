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

// Получение тестов учителя
router.get('/teacher', authenticateToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const tests = await pool.query(
      'SELECT tests.*, classes.name as class_name FROM tests LEFT JOIN classes ON tests.class_id = classes.id WHERE teacher_id = $1',
      [teacherId]
    );
    res.json(tests.rows);
  } catch (err) {
    console.error('Ошибка при загрузке тестов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Создание нового теста
router.post('/', authenticateToken, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const { title, class_id, questions } = req.body;
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

// Отправка ответов ученика
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Доступ разрешён только ученикам' });
    }

    const testId = req.params.id;
    const { answers } = req.body;
    console.log('Полученные ответы:', answers);

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: 'Поле answers отсутствует или пустое' });
    }

    const userId = req.user.id;
    const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }
    const studentId = student.rows[0].id;
    const classId = student.rows[0].class_id;

    const test = await pool.query(
      'SELECT * FROM tests WHERE id = $1 AND class_id = $2',
      [testId, classId]
    );
    if (test.rows.length === 0) {
      return res.status(403).json({ message: 'Тест недоступен для этого ученика' });
    }

    const existingSubmission = await pool.query(
      'SELECT * FROM student_submissions WHERE student_id = $1 AND test_id = $2',
      [studentId, testId]
    );

    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1', [testId]);
    if (questions.rows.length === 0) {
      return res.status(404).json({ message: 'Вопросы для теста не найдены' });
    }

    let score = 0;
    const totalPossibleScore = questions.rows.length;
    const answersObj = answers;

    for (const question of questions.rows) {
      const questionId = question.id.toString();
      const studentAnswers = answersObj[questionId] || [];

      if (question.type === 'single') {
        if (studentAnswers.length === 1 && studentAnswers[0] === question.correct_answer) {
          score += 1;
        }
      } else if (question.type === 'multiple') {
        const correctAnswers = question.correct_answers || [];
        const isCorrect = studentAnswers.length === correctAnswers.length &&
          studentAnswers.every(answer => correctAnswers.includes(answer)) &&
          correctAnswers.every(answer => studentAnswers.includes(answer));
        if (isCorrect) {
          score += 1;
        }
      }
    }

    if (existingSubmission.rows.length > 0) {
      const submissionId = existingSubmission.rows[0].id;
      await pool.query(
        'UPDATE student_submissions SET answers = $1, score = $2, total_possible_score = $3, submitted_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [answers, score, totalPossibleScore, submissionId]
      );
    } else {
      await pool.query(
        'INSERT INTO student_submissions (student_id, test_id, answers, score, total_possible_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [studentId, testId, answers, score, totalPossibleScore]
      );
    }

    res.status(201).json({
      submission: existingSubmission.rows.length > 0 ? existingSubmission.rows[0] : { student_id: studentId, test_id: testId, answers, score, total_possible_score: totalPossibleScore },
      score,
      totalPossibleScore,
      percentage: (score / totalPossibleScore) * 100
    });
  } catch (err) {
    console.error('Ошибка при отправке теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение результатов ученика (для учителя)
router.get('/results/:student_id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const studentId = req.params.student_id;
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

// Получение тестов для ученика
router.get('/student', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ только для учеников' });
  }

  console.log('Запрос тестов для ученика с ID:', req.user.id);
  try {
    const student = await pool.query(
      'SELECT class_id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    if (student.rows.length === 0) {
      console.log('Ученик не привязан к классу');
      return res.status(404).json({ message: 'Ученик не привязан к классу' });
    }

    const classId = student.rows[0].class_id;
    console.log('Найден класс с ID:', classId);

    const tests = await pool.query(
      'SELECT t.id, t.title, t.created_at FROM tests t WHERE t.class_id = $1',
      [classId]
    );
    console.log('Найдено тестов:', tests.rows.length);

    res.json(tests.rows);
  } catch (err) {
    console.error('Ошибка загрузки тестов для ученика:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение теста по ID для ученика
router.get('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ только для учеников' });
  }

  const testId = req.params.id;
  console.log('Запрос теста с ID:', testId);

  try {
    const userId = req.user.id;
    const student = await pool.query('SELECT class_id FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не привязан к классу' });
    }

    const classId = student.rows[0].class_id;
    const test = await pool.query(
      'SELECT t.* FROM tests t WHERE t.id = $1 AND t.class_id = $2',
      [testId, classId]
    );

    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или недоступен' });
    }

    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1',
      [testId]
    );

    res.json({
      ...test.rows[0],
      questions: questions.rows,
    });
  } catch (err) {
    console.error('Ошибка при загрузке теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение результатов тестов для ученика
router.get('/test-results/student', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ только для учеников' });
  }

  try {
    const userId = req.user.id;
    const student = await pool.query('SELECT id FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }

    const studentId = student.rows[0].id;
    const results = await pool.query(
      'SELECT ss.id, ss.test_id, t.title, ss.score, ss.total_possible_score, ss.submitted_at ' +
      'FROM student_submissions ss ' +
      'JOIN tests t ON ss.test_id = t.id ' +
      'WHERE ss.student_id = $1',
      [studentId]
    );

    res.json(results.rows);
  } catch (err) {
    console.error('Ошибка загрузки результатов тестов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;