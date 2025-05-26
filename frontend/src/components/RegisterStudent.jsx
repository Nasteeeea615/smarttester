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
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const RegisterContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: isSidebarOpen ? 250 : 0,
  padding: theme.spacing(4),
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: isSidebarOpen ? 200 : 0,
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

function RegisterStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    setLoading(true);

    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/auth/classes', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки классов: ${response.statusText}`);
        }

        const data = await response.json();
        setClasses(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Ошибка загрузки классов:', err);
          setError('Не удалось загрузить классы: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
    return () => controller.abort();
  }, [token]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleRegister = useCallback(async () => {
    if (!name || !email || !password || !classId) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    if (!validateEmail(email)) {
      setError('Введите корректный email');
      return;
    }

    try {
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'student' }),
      });

      const userData = await userResponse.json();
      if (!userResponse.ok) {
        throw new Error(userData.message || 'Ошибка регистрации пользователя');
      }

      const studentResponse = await fetch('/api/auth/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userData.id, class_id: classId }),
      });

      const studentData = await studentResponse.json();
      if (!studentResponse.ok) {
        throw new Error(studentData.message || 'Ошибка добавления ученика');
      }

      toast.success('Ученик успешно зарегистрирован!');
      navigate('/teacher');
    } catch (err) {
      setError('Ошибка регистрации: ' + err.message);
    }
  }, [name, email, password, classId, token, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (loading) {
    return (
      <RegisterContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <CircularProgress />
      </RegisterContainer>
    );
  }

  return (
    <>
      <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <RegisterContainer isSidebarOpen={isSidebarOpen}>
        <FormBox>
          <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
            Регистрация ученика
          </Typography>
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
          <TextField
            label="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ background: '#f5f7fa', borderRadius: '5px' }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ background: '#f5f7fa', borderRadius: '5px' }}
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ background: '#f5f7fa', borderRadius: '5px' }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ top: '-6px' }}>Класс</InputLabel>
            <Select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              variant="outlined"
              sx={{ background: '#f5f7fa', borderRadius: '5px' }}
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={handleRegister}
            fullWidth
            sx={{
              background: '#4a90e2',
              color: '#ffffff',
              fontWeight: 700,
              padding: '12px',
              borderRadius: '10px',
              mt: 3,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#3a80d2',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Зарегистрировать
          </Button>
        </FormBox>
      </RegisterContainer>
    </>
  );
}

export default RegisterStudent;