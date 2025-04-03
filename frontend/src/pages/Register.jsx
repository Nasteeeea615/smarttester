import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, TextField, Button, Typography, MenuItem, Select, InputLabel, FormControl, Chip } from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';

const RegisterContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f7fa',
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
  mt: 8,
}));

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [classId, setClassId] = useState('');
  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleFromUrl = params.get('role');
    if (roleFromUrl) {
      setRole(roleFromUrl);
    }

    fetch('/api/auth/classes')
      .then((res) => res.json())
      .then((data) => setClasses(data))
      .catch((err) => console.error(err));

    fetch('/api/auth/students')
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch((err) => console.error(err));
  }, [location]);

  const handleRegister = async () => {
    if (!name || !email || !password || !role || (role === 'student' && !classId) || (role === 'parent' && children.length === 0)) {
      setError('Все поля обязательны для заполнения');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, class_id: classId, children }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        toast.success('Регистрация успешна!');
        const decodedToken = JSON.parse(atob(data.token.split('.')[1]));
        const userRole = decodedToken.role;
        navigate(`/${userRole}`);
      } else {
        setError(data.message || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка сервера');
      console.error(err);
    }
  };

  const handleChildSelect = (childId) => {
    if (children.includes(childId)) {
      setChildren(children.filter((id) => id !== childId));
    } else {
      setChildren([...children, childId]);
    }
  };

  return (
    <RegisterContainer>
      <FormBox>
        <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
          Регистрация
        </Typography>
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
          <InputLabel sx={{ top: '-6px' }}>Роль</InputLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={!!new URLSearchParams(location.search).get('role')}
            variant="outlined"
            sx={{ background: '#f5f7fa', borderRadius: '5px' }}
          >
            <MenuItem value="teacher">Учитель</MenuItem>
            <MenuItem value="student">Ученик</MenuItem>
            <MenuItem value="parent">Родитель</MenuItem>
          </Select>
        </FormControl>
        {role === 'student' && (
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
        )}
        {role === 'parent' && (
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
                  sx={{ cursor: 'pointer', backgroundColor: children.includes(student.id) ? '#4a90e2' : '#f5f7fa', color: children.includes(student.id) ? '#ffffff' : '#1a2a44' }}
                />
              ))}
            </Box>
          </Box>
        )}
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
          Зарегистрироваться
        </Button>
        <Button
          variant="text"
          onClick={() => navigate('/login')}
          fullWidth
          sx={{ mt: 2, color: '#4a90e2', fontWeight: 500 }}
        >
          Уже есть аккаунт? Войти
        </Button>
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </FormBox>
    </RegisterContainer>
  );
}

export default Register;