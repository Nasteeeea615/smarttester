import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const RegisterContainer = styled(Box)(({ theme, $isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: $isSidebarOpen ? 250 : 0,
  padding: theme.spacing(4),
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: $isSidebarOpen ? 200 : 0,
    padding: theme.spacing(2),
  },
}));

const FormBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  maxWidth: 500,
  width: '100%',
  margin: '0 auto',
  mt: 4,
}));

function RegisterParent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [children, setChildren] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Требуется авторизация');
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/auth/students', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки учеников: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Загруженные ученики:', data);
        setStudents(data);
      } catch (err) {
        console.error('Ошибка при загрузке учеников:', err);
        setError('Не удалось загрузить список учеников: ' + err.message);
        toast.error('Не удалось загрузить список учеников');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleRegister = async () => {
    setError('');
    setSubmitting(true);

    if (!name || !email || !password || children.length === 0) {
      setError('Все поля обязательны для заполнения');
      toast.error('Все поля обязательны для заполнения');
      setSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Введите корректный email');
      toast.error('Введите корректный email');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      toast.error('Пароль должен содержать минимум 6 символов');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен отсутствует');
      }

      console.log('Отправка данных:', { name, email, children });

      // Сначала регистрируем пользователя
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role: 'parent' }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.message || 'Ошибка регистрации пользователя');
      }

      // Затем связываем родителя с детьми
      const parentResponse = await fetch('/api/auth/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          parent_id: userData.id,
          student_ids: children 
        }),
      });

      const parentData = await parentResponse.json();
      if (!parentResponse.ok) {
        throw new Error(parentData.message || 'Ошибка привязки родителя к детям');
      }

      toast.success('Родитель успешно зарегистрирован!');
      navigate('/teacher');
    } catch (err) {
      console.error('Ошибка при регистрации родителя:', err);
      setError('Ошибка регистрации: ' + err.message);
      toast.error('Ошибка регистрации: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChildSelect = useCallback((studentId) => {
    setChildren((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (loading) {
    return (
      <RegisterContainer $isSidebarOpen={isSidebarOpen}>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </RegisterContainer>
    );
  }

  return (
    <>
      <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <RegisterContainer $isSidebarOpen={isSidebarOpen}>
        <FormBox>
          <Typography variant="h5" fontWeight={700} mb={3} color="#1a2a44">
            Регистрация родителя
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Дети</InputLabel>
            <Select
              multiple
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const student = students.find((s) => s.id === value);
                    return (
                      <Chip
                        key={value}
                        label={student ? student.name : value}
                        onDelete={() => handleChildSelect(value)}
                      />
                    );
                  })}
                </Box>
              )}
            >
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            fullWidth
            variant="contained"
            onClick={handleRegister}
            disabled={submitting}
            sx={{ mt: 3 }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Зарегистрировать'}
          </Button>
        </FormBox>
      </RegisterContainer>
    </>
  );
}

export default RegisterParent;