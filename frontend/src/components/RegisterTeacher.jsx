import { useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { Box, Typography, TextField, Button } from '@mui/material';
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

   function RegisterTeacher() {
     const [name, setName] = useState('');
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [error, setError] = useState('');
     const navigate = useNavigate();

     const handleRegister = async () => {
       if (!name || !email || !password) {
         setError('Все поля обязательны для заполнения');
         return;
       }

       try {
         const response = await fetch('/api/auth/register', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ name, email, password, role: 'teacher' }),
         });

         const data = await response.json();
         if (response.ok) {
           localStorage.setItem('token', data.token);
           localStorage.setItem('role', 'teacher');
           toast.success('Регистрация успешна!');
           navigate('/teacher');
         } else {
           setError(data.message || 'Ошибка регистрации');
         }
       } catch (err) {
         setError('Ошибка сервера');
         console.error(err);
       }
     };

     return (
       <RegisterContainer>
         <FormBox>
           <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
             Регистрация учителя
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
         </FormBox>
       </RegisterContainer>
     );
   }

   export default RegisterTeacher;