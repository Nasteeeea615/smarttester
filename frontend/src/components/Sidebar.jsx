import { Box, List, ListItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdCreate, MdAssignment, MdPeople, MdLogout } from 'react-icons/md';

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: 250,
  height: '100vh',
  backgroundColor: '#1a2a44',
  color: '#ffffff',
  position: 'fixed',
  top: 0,
  left: 0,
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.spacing(2),
}));

const SidebarItem = styled(ListItem)(({ theme, active }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cursor: 'pointer',
}));

function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!role || !['teacher', 'student', 'parent'].includes(role)) {
    console.error(`Invalid role: ${role}`);
    return (
      <SidebarContainer>
        <Box p={2}>
          <Typography variant="h6" fontWeight={700}>
            SmartTester
          </Typography>
        </Box>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
        <Typography color="error" p={2}>
          Ошибка: Роль не указана или некорректна
        </Typography>
      </SidebarContainer>
    );
  }

  const teacherItems = [
    { text: 'Мои тесты', icon: <MdDashboard />, path: '/teacher' },
    { text: 'Создать тест', icon: <MdCreate />, path: '/teacher/create' },
  ];

  const studentItems = [
    { text: 'Мои тесты', icon: <MdAssignment />, path: '/student' },
  ];

  const parentItems = [
    { text: 'Результаты детей', icon: <MdPeople />, path: '/parent' },
  ];

  const items = role === 'teacher' ? teacherItems : role === 'student' ? studentItems : parentItems;

  return (
    <SidebarContainer>
      <Box p={2}>
        <Typography variant="h6" fontWeight={700}>
          SmartTester
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List>
        {items.map((item) => (
          <SidebarItem
            key={item.text}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </SidebarItem>
        ))}
      </List>
      <Box flexGrow={1} />
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      <SidebarItem
        onClick={() => {
          localStorage.removeItem('token');
          navigate('/');
        }}
      >
        <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
          <MdLogout />
        </ListItemIcon>
        <ListItemText primary="Выйти" />
      </SidebarItem>
    </SidebarContainer>
  );
}

export default Sidebar;