import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, CircularProgress, Container, Paper } from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import LockIcon from '@mui/icons-material/Lock';

// Стилизованный контейнер для страницы входа
const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'var(--background-light)',
  padding: 'var(--spacing-lg)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '250px',
    background: 'var(--primary-color)',
    zIndex: 0,
  },
}));

// Стилизованная форма входа
const FormBox = styled(Paper)(({ theme }) => ({
  background: 'var(--background-white)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--spacing-xl)',
  boxShadow: 'var(--shadow-md)',
  width: '100%',
  maxWidth: 450,
  position: 'relative',
  zIndex: 1,
}));

// Компонент страницы входа
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Анимации
  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  // Валидация email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Обработчик входа
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (!validateEmail(email)) {
      setError('Пожалуйста, введите корректный email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Неверный email или пароль');
      }

      if (!data.token) {
        throw new Error('Токен не получен от сервера');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      toast.success('Вход выполнен успешно!');

      switch (data.role) {
        case 'teacher':
          navigate('/teacher');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'parent':
          navigate('/parent');
          break;
        default:
          throw new Error('Неизвестная роль пользователя');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <FormBox elevation={6}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockIcon sx={{ fontSize: 48, color: 'var(--primary-color)', mb: 2 }} />
              <Typography variant="h4" fontWeight={700} color="var(--primary-color)">
                Вход в систему
              </Typography>
              <Typography variant="body1" color="var(--text-secondary)" sx={{ mt: 1 }}>
                Введите данные вашей учетной записи
              </Typography>
            </Box>
            
            <form onSubmit={handleLogin}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                disabled={loading}
                error={!!error}
                id="email-input"
                name="email"
                inputProps={{
                  'aria-label': 'Email',
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-sm)',
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-color)',
                    },
                  },
                }}
              />
              
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                disabled={loading}
                error={!!error}
                id="password-input"
                name="password"
                inputProps={{
                  'aria-label': 'Пароль',
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-sm)',
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-color)',
                    },
                  },
                }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--radius-sm)' }}>
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  background: 'var(--primary-color)',
                  color: 'var(--text-light)',
                  fontWeight: 600,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  '&:hover': {
                    background: 'var(--primary-light)',
                    boxShadow: 'var(--shadow-lg)',
                  },
                  '&:disabled': {
                    background: '#cccccc',
                  },
                  mb: 2,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="var(--text-secondary)">
                  Еще нет аккаунта?{' '}
                  <Link 
                    to="/register-teacher" 
                    style={{ 
                      color: 'var(--primary-color)', 
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    Зарегистрироваться
                  </Link>
                </Typography>
                
                <Typography variant="body2" color="var(--text-secondary)" sx={{ mt: 1 }}>
                  <Link 
                    to="/" 
                    style={{ 
                      color: 'var(--primary-color)', 
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    На главную страницу
                  </Link>
                </Typography>
              </Box>
            </form>
          </FormBox>
        </motion.div>
      </Container>
    </LoginContainer>
  );
}

export default React.memo(Login);