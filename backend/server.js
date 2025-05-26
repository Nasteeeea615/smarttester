const express = require('express');
const app = express();
require('dotenv').config();
const pool = require('./db');
const authRoutes = require('./routes/auth');
const testsRoutes = require('./routes/tests');
const classesRoutes = require('./routes/classes');
const studentsRoutes = require('./routes/students');
const testAssignmentsRoutes = require('./routes/test_assignments');

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/test-assignments', testAssignmentsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});