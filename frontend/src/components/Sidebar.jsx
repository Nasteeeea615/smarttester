import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate, Link } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import HistoryIcon from '@mui/icons-material/History';

/**
 * Стилизованный контейнер для боковой панели
 */
const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$open',
})(({ theme, $open }) => ({
  width: 250,
  height: '100vh',
  background: 'var(--primary-color)',
  color: 'var(--text-light)',
  position: 'fixed',
  top: 0,
  left: $open ? 0 : -250,
  padding: 'var(--spacing-lg)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflowY: 'auto',
  transition: 'left var(--transition-normal)',
  zIndex: 1200,
  boxShadow: $open ? 'var(--shadow-lg)' : 'none',
  [theme.breakpoints.down('sm')]: {
    width: '200px',
  },
}));

/**
 * Стилизованная кнопка выхода
 */
const LogoutButton = styled(Button)(({ theme }) => ({
  color: 'var(--text-light)',
  borderColor: 'var(--text-light)',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'var(--text-light)',
  },
}));

/**
 * Компонент боковой панели навигации
 * @param {string} role - Роль пользователя (teacher, student, parent)
 * @param {boolean} open - Состояние открытия боковой панели
 * @param {function} toggleSidebar - Функция для переключения состояния боковой панели
 */
function Sidebar({ role = 'student', open, toggleSidebar }) {
  const navigate = useNavigate();
  
  // Внутреннее состояние, если внешнее не предоставлено
  const [internalOpen, setInternalOpen] = useState(true);
  
  // Определяем активное состояние и функцию переключения
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  // Функция для переключения состояния
  const handleToggle = () => {
    console.log("Toggle clicked", { isControlled, isOpen });
    
    if (isControlled && toggleSidebar) {
      // Если компонент управляемый, вызываем внешнюю функцию
      toggleSidebar();
    } else {
      // Иначе используем внутреннее состояние
      setInternalOpen(!internalOpen);
    }
  };
  
  // Отладочный эффект
  useEffect(() => {
    console.log("Sidebar state updated", { isControlled, isOpen, internalOpen, externalOpen: open });
  }, [isOpen, internalOpen, open, isControlled]);

  // Иконки и пункты меню для различных ролей
  const menuItems = {
    teacher: [
      { text: 'Мои тесты', path: '/teacher', icon: <DashboardIcon /> },
      { text: 'Создание тестов', path: '/teacher/create', icon: <AssignmentIcon /> },
      { text: 'Результаты', path: '/teacher/results', icon: <AssessmentIcon /> },
      { text: 'Зарегистрировать ученика', path: '/teacher/register-student', icon: <PersonAddIcon /> },
      { text: 'Зарегистрировать родителя', path: '/teacher/register-parent', icon: <FamilyRestroomIcon /> },
    ],
    student: [
      { text: 'Доступные тесты', path: '/student', icon: <AssignmentIcon /> },
      { text: 'Пройденные тесты', path: '/student/completed-tests', icon: <HistoryIcon /> },
    ],
    parent: [
      { text: 'Результаты детей', path: '/parent', icon: <AssessmentIcon /> },
    ],
  };

  // Получаем пункты меню для текущей роли
  const items = menuItems[role] || menuItems.student;

  // Обработчик для выхода из системы
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <>
      <SidebarContainer $open={isOpen}>
        <Box>
          <Typography variant="h5" fontWeight={700} mb={3} 
            sx={{ 
              color: 'var(--text-light)', 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
            <DashboardIcon /> SmartTester
          </Typography>
          <List>
            {items.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 'var(--radius-sm)',
                  mb: 1,
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  transition: 'background-color var(--transition-fast)',
                  '&:hover': { 
                    background: 'var(--primary-light)',
                    transform: 'translateX(5px)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'var(--text-light)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <Box>
          <Typography variant="body2" align="center" mb={2} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Роль: {role === 'teacher' ? 'Учитель' : role === 'student' ? 'Ученик' : 'Родитель'}
          </Typography>
          <LogoutButton
            variant="outlined"
            fullWidth
            onClick={handleLogout}
            startIcon={<i className="fas fa-sign-out-alt"></i>}
          >
            Выйти
          </LogoutButton>
        </Box>
      </SidebarContainer>
      
      {/* Кнопка для переключения боковой панели */}
      <IconButton
        onClick={handleToggle}
        aria-label={isOpen ? 'Скрыть меню' : 'Показать меню'}
        sx={{
          position: 'fixed',
          top: 16,
          left: isOpen ? 266 : 16,
          zIndex: 1300,
          color: 'var(--primary-color)',
          backgroundColor: 'var(--background-white)',
          boxShadow: 'var(--shadow-sm)',
          '&:hover': {
            backgroundColor: 'var(--background-light)',
          },
          transition: 'left var(--transition-normal)',
        }}
      >
        <MenuIcon />
      </IconButton>
    </>
  );
}

export default Sidebar;