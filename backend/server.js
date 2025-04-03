const express = require('express');
const app = express();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const classRoutes = require('./routes/classes');

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/classes', classRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  pool.connect((err) => {
    if (err) {
      console.error('Ошибка подключения к PostgreSQL:', err);
    } else {
      console.log('Подключено к PostgreSQL');
    }
  });
});