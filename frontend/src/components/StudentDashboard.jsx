import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  CircularProgress, 
  Card, 
  CardContent,
  Divider,
  Grid,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';

// Стилизованный контейнер для страницы
const DashboardContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$open',
})(({ theme, $open }) => ({
  minHeight: '100vh',
  background: 'var(--background-light)',
  marginLeft: $open ? 250 : 0,
  padding: 'var(--spacing-xl)',
  transition: 'margin-left var(--transition-normal)',
  [theme.breakpoints.down('lg')]: {
    marginLeft: 0,
    padding: 'var(--spacing-lg)',
  },
  [theme.breakpoints.down('md')]: {
    padding: 'var(--spacing-md)',
  },
}));

// Стилизованная карточка теста
const TestCard = styled(Card)(({ theme }) => ({
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
  transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--shadow-hover)',
  },
}));

// Анимация для карточек
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

/**
 * Компонент дашборда студента
 */
function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Обработчик переключения боковой панели
  const toggleSidebar = useCallback(() => {
    console.log("Toggling sidebar from StudentDashboard", { current: sidebarOpen });
    setSidebarOpen(prev => !prev);
  }, [sidebarOpen]);

  // Загрузка доступных тестов при монтировании компонента
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    setLoading(true);

    fetch('/api/tests/student', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTests(data);
        } else {
          setError(data.message || 'Ошибка загрузки тестов');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(`Не удалось загрузить тесты: ${err.message}`);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token]);

  // Обработчик для перехода к тесту
  const handleTakeTest = useCallback((testId) => {
    navigate(`/student/test/${testId}`);
  }, [navigate]);

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  // Для отладки
  useEffect(() => {
    console.log("StudentDashboard render", { sidebarOpen });
  }, [sidebarOpen]);

  return (
    <>
      <Sidebar role="student" open={sidebarOpen} toggleSidebar={toggleSidebar} />
      <DashboardContainer $open={sidebarOpen}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, md: 4 }, 
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-color)',
            color: 'var(--text-light)',
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SchoolIcon sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" fontWeight={700}>
              Доступные тесты
            </Typography>
          </Box>
          <Typography variant="body1">
            Здесь вы можете увидеть все тесты, доступные для прохождения. 
            Выберите тест и нажмите "Пройти тест" для начала тестирования.
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 'var(--radius-sm)' }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: 'var(--primary-color)' }} />
          </Box>
        ) : tests.length === 0 && !error ? (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'var(--background-white)',
            }}
          >
            <Typography variant="h6" color="var(--text-secondary)" sx={{ mb: 2 }}>
              Нет доступных тестов для вашего класса.
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              Пожалуйста, проверьте позже или обратитесь к учителю.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {tests.map((test, index) => (
              <Grid item xs={12} md={6} lg={4} key={test.id}>
                <motion.div
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <TestCard>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <AssignmentIcon sx={{ color: 'var(--primary-color)', mr: 1, mt: 0.5 }} />
                        <Typography variant="h6" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                          {test.title}
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon sx={{ color: 'var(--text-secondary)', mr: 1, fontSize: '0.9rem' }} />
                        <Typography variant="body2" color="var(--text-secondary)">
                          Создан: {formatDate(test.created_at)}
                        </Typography>
                      </Box>
                      
                      {test.class_name && (
                        <Chip 
                          label={test.class_name} 
                          size="small" 
                          sx={{ 
                            mt: 1, 
                            background: 'var(--primary-color)',
                            color: 'var(--text-light)',
                            fontWeight: 500,
                          }} 
                        />
                      )}
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        onClick={() => handleTakeTest(test.id)}
                        fullWidth
                        sx={{
                          background: 'var(--primary-color)',
                          color: 'var(--text-light)',
                          '&:hover': { background: 'var(--primary-light)' },
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                        }}
                      >
                        Пройти тест
                      </Button>
                    </Box>
                  </TestCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </DashboardContainer>
    </>
  );
}

export default StudentDashboard;