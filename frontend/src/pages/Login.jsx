import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#f5f7fa',
  padding: theme.spacing(2),
}));

const FormBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  width: '100%',
  maxWidth: 400,
}));

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
  
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
        throw new Error(data.message || 'Ошибка входа');
      }
  
      console.log('Полученный токен:', data.token); // Отладка
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
  
      if (data.role === 'teacher') {
        navigate('/teacher');
      } else if (data.role === 'student') {
        navigate('/student');
      } else if (data.role === 'parent') {
        navigate('/parent');
      }
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError(err.message);
    }
  };

  return (
    <LoginContainer>
      <FormBox>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Вход
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, background: '#4a90e2', color: '#ffffff' }}
          >
            Войти
          </Button>
        </form>
      </FormBox>
    </LoginContainer>
  );
}

export default Login;