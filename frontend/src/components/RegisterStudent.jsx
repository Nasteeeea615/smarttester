import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const RegisterContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: 250,
  padding: theme.spacing(4),
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    fetch('/api/auth/classes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((err) => {
        setError('Не удалось загрузить классы: ' + err.message);
        console.error(err);
      });
  }, [navigate]);

  const handleRegister = async () => {
    if (!name || !email || !password || !classId) {
      setError('Все поля обязательны для заполнения');
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

      const token = localStorage.getItem('token');
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
      console.error(err);
    }
  };

  return (
    <>
      <Sidebar role="teacher" />
      <RegisterContainer>
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