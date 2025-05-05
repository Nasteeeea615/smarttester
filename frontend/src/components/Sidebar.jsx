import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 250,
  height: '100vh',
  background: '#1a237e', // Тёмно-синий цвет
  color: '#ffffff',
  position: 'fixed',
  top: 0,
  left: 0,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  color: '#ffffff',
  borderColor: '#ffffff',
  '&:hover': {
    backgroundColor: '#3f51b5', // Чуть светлее тёмно-синего при наведении
    borderColor: '#ffffff',
  },
}));

function Sidebar({ role }) {
  const navigate = useNavigate();

  const teacherItems = [
    { text: 'Мои тесты', path: '/teacher' },
    { text: 'Создание тестов', path: '/teacher/create' },
  ];

  const studentItems = [
    { text: 'Доступные тесты', path: '/teacher' },
  ];

  const parentItems = [
    { text: 'Результаты детей', path: '/parent' },
  ];

  const items = role === 'teacher' ? teacherItems : role === 'student' ? studentItems : parentItems;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <SidebarContainer>
      <Box>
        <Typography variant="h6" fontWeight={700} mb={3}>
          SmartTester
        </Typography>
        <List>
          {items.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '5px',
                mb: 1,
                '&:hover': { background: '#3f51b5' }, // Чуть светлее тёмно-синего при наведении
              }}
            >
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box>
        <Typography variant="body2" align="center" mb={2}>
          Роль: {role === 'teacher' ? 'Учитель' : role === 'student' ? 'Ученик' : 'Родитель'}
        </Typography>
        <LogoutButton
          variant="outlined"
          fullWidth
          onClick={handleLogout}
        >
          Выйти
        </LogoutButton>
      </Box>
    </SidebarContainer>
  );
}

export default Sidebar;