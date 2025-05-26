const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Схема валидации теста
const testSchema = Joi.object({
  title: Joi.string().required().max(255),
  classId: Joi.number().integer().required(),
  questions: Joi.array()
    .items(
      Joi.object({
        question_text: Joi.string().required().max(1000),
        type: Joi.string().valid('single', 'multiple').required(),
        image_url: Joi.string().allow(null).uri(),
        formula: Joi.string().allow('').max(1000),
      })
    )
    .min(1)
    .required(),
});

// Получение списка классов
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }
    const teacherId = req.user.id;
    const classes = await pool.query(
      'SELECT id, name FROM classes WHERE teacher_id = $1',
      [teacherId]
    );
    res.json(classes.rows);
  } catch (err) {
    console.error('Ошибка при загрузке классов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение всех тестов для учителя с пагинацией
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }
    const teacherId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const tests = await pool.query(
      'SELECT t.id, t.title, t.class_id, c.name as class_name, t.created_at ' +
      'FROM tests t ' +
      'JOIN classes c ON t.class_id = c.id ' +
      'WHERE t.teacher_id = $1 ' +
      'LIMIT $2 OFFSET $3',
      [teacherId, limit, offset]
    );
    const total = await pool.query('SELECT COUNT(*) FROM tests WHERE teacher_id = $1', [teacherId]);
    res.json({
      tests: tests.rows,
      total: parseInt(total.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error('Ошибка при загрузке тестов:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Создание нового теста
router.post('/', authenticateToken, upload.any(), async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }
    const { title, classId } = req.body;
    if (!title || !classId) {
      return res.status(400).json({ message: 'Поля title и classId обязательны' });
    }

    const teacherId = req.user.id;
    const classResult = await client.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );
    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Класс не найден или не принадлежит этому учителю' });
    }

    await client.query('BEGIN');
    const newTest = await client.query(
      'INSERT INTO tests (title, class_id, teacher_id, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
      [title, classId, teacherId]
    );
    const test = newTest.rows[0];

    // Парсинг questions как JSON-строки
    let questions = [];
    if (req.body.questions) {
      try {
        questions = JSON.parse(req.body.questions);
      } catch (e) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Неверный формат JSON для questions' });
      }
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: '"questions" must contain at least 1 items' });
    }

    // Обработка изображений и подготовка данных для валидации
    const validatedQuestions = questions.map((q, index) => {
      let imageUrl = q.image_url || null;
      const imageFile = req.files.find((file) => file.fieldname === `image_${index}`);
      if (imageFile) {
        imageUrl = `/uploads/${imageFile.filename}`;
      }
      return {
        question_text: q.question_text || '',
        type: q.type || 'single',
        image_url: imageUrl,
        formula: q.formula || '',
      };
    });

    // Валидация
    const { error } = testSchema.validate({ title, classId, questions: validatedQuestions });
    if (error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: error.details[0].message });
    }

    // Вставка вопросов и вариантов ответов
    const insertedQuestions = [];
    for (const q of validatedQuestions) {
      const newQuestion = await client.query(
        'INSERT INTO questions (test_id, question_text, type, image_url, formula, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
        [test.id, q.question_text, q.type, q.image_url, q.formula]
      );
      insertedQuestions.push(newQuestion.rows[0]);

      // Сохранение вариантов ответов в таблице options
      const originalQuestion = questions.find(qq => qq.question_text === q.question_text);
      if (originalQuestion && originalQuestion.options) {
        for (let i = 0; i < originalQuestion.options.length; i++) {
          const optionText = originalQuestion.options[i];
          const isCorrect = originalQuestion.type === 'single'
            ? optionText === originalQuestion.correct_answer
            : originalQuestion.correct_answers?.includes(optionText) || false;
          await client.query(
            'INSERT INTO options (question_id, text, is_correct, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [newQuestion.rows[0].id, optionText, isCorrect]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...test, class_id: classId, questions: insertedQuestions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при создании теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  } finally {
    client.release();
  }
});

// Редактирование теста
router.put('/edit/:testId', authenticateToken, upload.any(), async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }
    const testId = req.params.testId;
    const teacherId = req.user.id;
    const { title, classId } = req.body;
    if (!title || !classId) {
      return res.status(400).json({ message: 'Поля title и classId обязательны' });
    }

    const test = await client.query(
      'SELECT * FROM tests WHERE id = $1 AND teacher_id = $2',
      [testId, teacherId]
    );
    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или недоступен' });
    }

    const classResult = await client.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );
    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Класс не найден или не принадлежит этому учителю' });
    }

    await client.query('BEGIN');
    await client.query(
      'UPDATE tests SET title = $1, class_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [title, classId, testId]
    );
    await client.query('DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE test_id = $1)', [testId]);
    await client.query('DELETE FROM questions WHERE test_id = $1', [testId]);

    // Парсинг questions как JSON-строки
    let questions = [];
    if (req.body.questions) {
      try {
        questions = JSON.parse(req.body.questions);
      } catch (e) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Неверный формат JSON для questions' });
      }
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: '"questions" must contain at least 1 items' });
    }

    // Обработка изображений и подготовка данных для валидации
    const validatedQuestions = questions.map((q, index) => {
      let imageUrl = q.image_url || null;
      const imageFile = req.files.find((file) => file.fieldname === `image_${index}`);
      if (imageFile) {
        imageUrl = `/uploads/${imageFile.filename}`;
      }
      return {
        question_text: q.question_text || '',
        type: q.type || 'single',
        image_url: imageUrl,
        formula: q.formula || '',
      };
    });

    // Валидация
    const { error } = testSchema.validate({ title, classId, questions: validatedQuestions });
    if (error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: error.details[0].message });
    }

    // Вставка вопросов и вариантов ответов
    const insertedQuestions = [];
    for (const q of validatedQuestions) {
      const newQuestion = await client.query(
        'INSERT INTO questions (test_id, question_text, type, image_url, formula, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
        [testId, q.question_text, q.type, q.image_url, q.formula]
      );
      insertedQuestions.push(newQuestion.rows[0]);

      // Сохранение вариантов ответов в таблице options
      const originalQuestion = questions.find(qq => qq.question_text === q.question_text);
      if (originalQuestion && originalQuestion.options) {
        for (let i = 0; i < originalQuestion.options.length; i++) {
          const optionText = originalQuestion.options[i];
          const isCorrect = originalQuestion.type === 'single'
            ? optionText === originalQuestion.correct_answer
            : originalQuestion.correct_answers?.includes(optionText) || false;
          await client.query(
            'INSERT INTO options (question_id, text, is_correct, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [newQuestion.rows[0].id, optionText, isCorrect]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Тест успешно обновлён', testId, questions: insertedQuestions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при редактировании теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  } finally {
    client.release();
  }
});

// Просмотр теста учителем
router.get('/view/:testId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }
    const testId = req.params.testId;
    const teacherId = req.user.id;
    const test = await pool.query(
      'SELECT t.*, c.name as class_name FROM tests t JOIN classes c ON t.class_id = c.id WHERE t.id = $1 AND t.teacher_id = $2',
      [testId, teacherId]
    );
    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или недоступен' });
    }
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1',
      [testId]
    );
    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (question) => {
        const options = await pool.query(
          'SELECT * FROM options WHERE question_id = $1',
          [question.id]
        );
        return { ...question, options: options.rows };
      })
    );
    res.json({
      ...test.rows[0],
      questions: questionsWithOptions,
    });
  } catch (err) {
    console.error('Ошибка при загрузке теста:', err.stack);
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
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: 'Поле answers отсутствует или пустое' });
    }
    const userId = req.user.id;
    const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }
    const studentId = student.rows[0].id;
    const classId = student.rows[0].class_id;

    // Получаем информацию о тесте
    const test = await pool.query(
      'SELECT * FROM tests WHERE id = $1 AND class_id = $2',
      [testId, classId]
    );
    if (test.rows.length === 0) {
      return res.status(403).json({ message: 'Тест недоступен для этого ученика' });
    }

    // Получаем вопросы теста
    const questions = await pool.query('SELECT * FROM questions WHERE test_id = $1', [testId]);
    if (questions.rows.length === 0) {
      return res.status(404).json({ message: 'Вопросы для теста не найдены' });
    }

    let score = 0;
    const totalPossibleScore = questions.rows.length;
    for (const question of questions.rows) {
      const questionId = question.id.toString();
      const studentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [answers[questionId]];
      const options = await pool.query(
        'SELECT * FROM options WHERE question_id = $1',
        [question.id]
      );
      if (question.type === 'single') {
        const correctOption = options.rows.find(opt => opt.is_correct);
        const correctAnswer = correctOption ? correctOption.text : null;
        if (studentAnswers.length === 1 && studentAnswers[0] === correctAnswer) {
          score += 1;
        }
      } else if (question.type === 'multiple') {
        const correctAnswers = options.rows
          .filter(opt => opt.is_correct)
          .map(opt => opt.text);
        const isCorrect = studentAnswers.length === correctAnswers.length &&
          studentAnswers.every(answer => correctAnswers.includes(answer)) &&
          correctAnswers.every(answer => studentAnswers.includes(answer));
        if (isCorrect) {
          score += 1;
        }
      }
    }

    // Создаем новую запись о сдаче теста
    const newSubmission = await pool.query(
        'INSERT INTO student_submissions (student_id, test_id, answers, score, total_possible_score, submitted_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING *',
        [studentId, testId, JSON.stringify(answers), score, totalPossibleScore]
      );

    res.status(201).json({
      submission: newSubmission.rows[0],
      score,
      totalPossibleScore,
      percentage: (score / totalPossibleScore) * 100,
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
  try {
    const student = await pool.query(
      'SELECT class_id FROM students WHERE user_id = $1',
      [req.user.id]
    );
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не привязан к классу' });
    }
    const classId = student.rows[0].class_id;
    const tests = await pool.query(
      'SELECT t.id, t.title, t.created_at FROM tests t WHERE t.class_id = $1',
      [classId]
    );
    res.json(tests.rows);
  } catch (err) {
    console.error('Ошибка загрузки тестов для ученика:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение теста по ID для ученика
router.get('/student/:testId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ только для учеников' });
  }
  const testId = req.params.testId;
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
    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (question) => {
        const options = await pool.query(
          'SELECT * FROM options WHERE question_id = $1',
          [question.id]
        );
        return { ...question, options: options.rows };
      })
    );
    res.json({
      ...test.rows[0],
      questions: questionsWithOptions,
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
      'SELECT ss.id, ss.test_id, t.title as test_title, ss.score, ss.total_possible_score, ss.submitted_at ' +
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

// Получение деталей сдачи для ученика
router.get('/submission/:submission_id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ только для учеников' });
  }
  const submissionId = req.params.submission_id;
  const userId = req.user.id;
  try {
    const submission = await pool.query(
      'SELECT ss.*, t.title, t.id as test_id FROM student_submissions ss ' +
      'JOIN tests t ON ss.test_id = t.id ' +
      'JOIN students s ON ss.student_id = s.id ' +
      'WHERE ss.id = $1 AND s.user_id = $2',
      [submissionId, userId]
    );
    if (submission.rows.length === 0) {
      return res.status(404).json({ message: 'Результат не найден' });
    }
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1',
      [submission.rows[0].test_id]
    );
    const questionsWithOptions = await Promise.all(
      questions.rows.map(async (question) => {
        const options = await pool.query(
          'SELECT * FROM options WHERE question_id = $1',
          [question.id]
        );
        return { ...question, options: options.rows };
      })
    );
    res.json({
      submission: submission.rows[0],
      questions: questionsWithOptions,
    });
  } catch (err) {
    console.error('Ошибка загрузки результата:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Получение информации о попытках для ученика
router.get('/attempts/:testId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Доступ разрешён только ученикам' });
    }
    const testId = req.params.testId;
    const userId = req.user.id;
    const student = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ message: 'Ученик не найден' });
    }
    const studentId = student.rows[0].id;

    // Получаем информацию о тесте
    const test = await pool.query(
      'SELECT attempts_limit FROM tests WHERE id = $1',
      [testId]
    );
    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден' });
    }

    const attemptsLimit = test.rows[0].attempts_limit;
    if (attemptsLimit === 0) {
      return res.json({ attempts_left: -1 }); // -1 означает без ограничений
    }

    // Получаем количество использованных попыток
    const attemptsCount = await pool.query(
      'SELECT COUNT(*) FROM student_submissions WHERE student_id = $1 AND test_id = $2',
      [studentId, testId]
    );
    const attemptsLeft = attemptsLimit - parseInt(attemptsCount.rows[0].count);

    res.json({ attempts_left: Math.max(0, attemptsLeft) });
  } catch (err) {
    console.error('Ошибка при получении информации о попытках:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Удаление теста
router.delete('/:testId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Доступ разрешён только учителям' });
    }

    const testId = req.params.testId;
    const teacherId = req.user.id;

    // Проверяем, существует ли тест и принадлежит ли он учителю
    const test = await client.query(
      'SELECT id FROM tests WHERE id = $1 AND teacher_id = $2',
      [testId, teacherId]
    );

    if (test.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден или недоступен' });
    }

    await client.query('BEGIN');

    // Удаляем все связанные записи
    await client.query('DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE test_id = $1)', [testId]);
    await client.query('DELETE FROM questions WHERE test_id = $1', [testId]);
    await client.query('DELETE FROM test_submissions WHERE test_id = $1', [testId]);
    await client.query('DELETE FROM tests WHERE id = $1', [testId]);

    await client.query('COMMIT');
    res.json({ message: 'Тест успешно удалён' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при удалении теста:', err.stack);
    res.status(500).json({ message: 'Ошибка сервера при удалении теста' });
  } finally {
    client.release();
  }
});

module.exports = router;