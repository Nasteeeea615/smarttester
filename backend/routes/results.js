const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// Получение результатов класса
router.get('/class/:classId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Доступ разрешён только учителям' });
  }

  try {
    const classId = req.params.classId;
    
    // Проверяем, принадлежит ли класс этому учителю
    const classCheck = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, req.user.id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Получаем всех учеников класса
    const students = await pool.query(
      'SELECT s.id as student_id, u.name as student_name FROM students s ' +
      'JOIN users u ON s.user_id = u.id WHERE s.class_id = $1',
      [classId]
    );

    // Получаем все тесты для класса
    const tests = await pool.query(
      'SELECT id as test_id, title as test_title FROM tests WHERE class_id = $1',
      [classId]
    );

    const results = [];

    // Для каждого ученика и теста получаем результаты
    for (const student of students.rows) {
      for (const test of tests.rows) {
        const submissions = await pool.query(
          'SELECT id, score, total_possible_score, submitted_at, answers ' +
          'FROM student_submissions ' +
          'WHERE student_id = $1 AND test_id = $2 ' +
          'ORDER BY submitted_at DESC',
          [student.student_id, test.test_id]
        );

        if (submissions.rows.length > 0) {
          results.push({
            student_id: student.student_id,
            student_name: student.student_name,
            test_id: test.test_id,
            test_title: test.test_title,
            submissions: submissions.rows.map(sub => ({
              id: sub.id,
              score: sub.score,
              total_possible_score: sub.total_possible_score,
              submitted_at: sub.submitted_at,
              answers: sub.answers
            }))
          });
        }
      }
    }

    // Добавим логирование для отладки
    console.log('Class ID:', classId);
    console.log('Number of students:', students.rows.length);
    console.log('Number of tests:', tests.rows.length);
    console.log('Number of results:', results.length);
    if (results.length > 0) {
      console.log('First result:', JSON.stringify(results[0], null, 2));
    }

    res.json(results);
  } catch (err) {
    console.error('Ошибка при загрузке результатов класса:', err);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

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
  console.log('Parent request received. User:', req.user);
  
  if (req.user.role !== 'parent') {
    console.log('Access denied. User role:', req.user.role);
    return res.status(403).json({ message: 'Доступ запрещён' });
  }

  try {
    // Получаем ID детей родителя
    const children = await pool.query(
      `SELECT s.id as student_id 
       FROM parents p 
       JOIN students s ON p.student_id = s.id 
       WHERE p.parent_id = $1`,
      [req.user.id]
    );
    
    console.log('Found children:', children.rows);
    const childIds = children.rows.map((child) => child.student_id);

    if (childIds.length === 0) {
      console.log('No children found for parent');
      return res.json([]);
    }

    // Получаем результаты тестов
    const results = await pool.query(
      `SELECT 
        ss.id,
        ss.score,
        ss.total_possible_score,
        ss.submitted_at,
        t.title,
        u.name AS student_name
       FROM student_submissions ss 
       JOIN tests t ON ss.test_id = t.id 
       JOIN students s ON ss.student_id = s.id 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ANY($1::int[])
       ORDER BY ss.submitted_at DESC`,
      [childIds]
    );

    console.log('Query results:', results.rows);
    res.json(results.rows);
  } catch (err) {
    console.error('Error fetching parent results:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получение вопросов для теста
router.get('/tests/:testId/questions', authenticateToken, async (req, res) => {
  try {
    const testId = req.params.testId;
    
    // Проверяем, существует ли тест и имеет ли текущий учитель к нему отношение (опционально, зависит от логики доступа)
    // Например, если тесты привязаны к классам, а классы к учителям:
    const testCheck = await pool.query(
      'SELECT t.id FROM tests t JOIN classes c ON t.class_id = c.id WHERE t.id = $1 AND c.teacher_id = $2',
      [testId, req.user.id]
    );

    if (testCheck.rows.length === 0) {
      // Если тест не найден или учитель не имеет к нему отношения
      // Можно вернуть 404 (не найдено) или 403 (доступ запрещен)
      return res.status(404).json({ message: 'Тест не найден или доступ запрещён' });
    }

    // Получаем вопросы для теста
    const questions = await pool.query(
      'SELECT id, test_id, type, text, options, correct_answer, correct_answers FROM questions WHERE test_id = $1 ORDER BY id', // Или по другому полю для порядка
      [testId]
    );
    
    res.json(questions.rows);
  } catch (err) {
    console.error('Ошибка при загрузке вопросов теста:', err);
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;