const express = require('express');
const app = express();
require('dotenv').config();
const pool = require('./db');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const testsRoutes = require('./routes/tests');
const classesRoutes = require('./routes/classes');
const studentsRoutes = require('./routes/students');
const testAssignmentsRoutes = require('./routes/test_assignments');
const resultsRoutes = require('./routes/results');

// Настройка хранилища для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middleware
app.use(helmet()); // Защита HTTP-заголовков
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/test-assignments', testAssignmentsRoutes);
app.use('/api/results', resultsRoutes);

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Что-то пошло не так на сервере',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Проверка подключения к базе данных и запуск сервера
const startServer = async () => {
  try {
    await pool.connect();
    console.log('Успешное подключение к базе данных');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка подключения к базе данных:', err.stack);
    process.exit(1);
  }
};

startServer();