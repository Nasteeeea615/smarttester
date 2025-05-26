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
  Chip,
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

function RegisterParent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [children, setChildren] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    fetch('/api/auth/students', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => {
        setError('Не удалось загрузить список учеников: ' + err.message);
        console.error(err);
      });
  }, [navigate]);

  const handleRegister = async () => {
    if (!name || !email || !password || children.length === 0) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, children }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка регистрации');
      }

      toast.success('Родитель успешно зарегистрирован!');
      navigate('/teacher');
    } catch (err) {
      setError('Ошибка регистрации: ' + err.message);
      console.error(err);
    }
  };

  const handleChildSelect = (studentId) => {
    setChildren((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  return (
    <>
      <Sidebar role="teacher" />
      <RegisterContainer>
        <FormBox>
          <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
            Регистрация родителя
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
          <Box mt={2}>
            <Typography variant="h6" fontWeight={500} mb={1} color="#1a2a44">
              Выберите детей
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {students.map((student) => (
                <Chip
                  key={student.id}
                  label={student.name}
                  onClick={() => handleChildSelect(student.id)}
                  color={children.includes(student.id) ? 'primary' : 'default'}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: children.includes(student.id) ? '#4a90e2' : '#f5f7fa',
                    color: children.includes(student.id) ? '#ffffff' : '#1a2a44',
                  }}
                />
              ))}
            </Box>
          </Box>
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

export default RegisterParent;