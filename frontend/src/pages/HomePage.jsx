import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Container, Grid, Card, CardContent } from '@mui/material';
import { styled } from '@mui/system';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EqualizerIcon from '@mui/icons-material/Equalizer';

// Стилизованный контейнер для главной секции
const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--background-light)',
  padding: 'var(--spacing-xxl)',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: 'var(--primary-color)',
    zIndex: 0,
  },
  [theme.breakpoints.down('md')]: {
    padding: 'var(--spacing-lg)',
  },
}));

// Стилизованная карточка функций
const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-md)',
  transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: 'var(--shadow-hover)',
  },
}));

// Компонент главной страницы
function HomePage() {
  const navigate = useNavigate();

  // Анимации с использованием framer-motion
  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  const subtitleVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, delay: 0.3, ease: 'easeOut' } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        delay: 0.5 + (i * 0.2), 
        ease: 'easeOut' 
      } 
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.8, ease: 'easeOut' } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  // Функциональные особенности системы
  const features = [
    {
      title: 'Для учителей',
      description: 'Создавайте тесты, анализируйте результаты учеников и отслеживайте прогресс обучения.',
      icon: <SchoolIcon sx={{ fontSize: 40, color: 'var(--primary-color)' }} />,
    },
    {
      title: 'Для учеников',
      description: 'Проходите тесты и улучшайте свои знания.',
      icon: <AssignmentIcon sx={{ fontSize: 40, color: 'var(--secondary-color)' }} />,
    },
    {
      title: 'Аналитика',
      description: 'Статистика успеваемости классов и каждого ученика.',
      icon: <EqualizerIcon sx={{ fontSize: 40, color: 'var(--success-color)' }} />,
    },
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Заголовок и подзаголовок */}
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              backgroundColor: 'var(--background-white)',
              borderRadius: 'var(--radius-lg)',
              padding: { xs: 'var(--spacing-lg)', md: 'var(--spacing-xl)' },
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <motion.div initial="hidden" animate="visible" variants={titleVariants}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: 'var(--primary-color)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                SmartTester
              </Typography>
            </motion.div>
            
            <motion.div initial="hidden" animate="visible" variants={subtitleVariants}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-lg)',
                  maxWidth: '800px',
                  mx: 'auto',
                }}
              >
                Платформа для создания, прохождения и анализа тестов 
              </Typography>
            </motion.div>
            
            {/* Кнопки действий */}
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <motion.div initial="hidden" animate="visible" whileHover="hover" variants={buttonVariants}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register-teacher')}
                  sx={{
                    background: 'var(--primary-color)',
                    color: 'var(--text-light)',
                    fontWeight: 600,
                    padding: '12px 30px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    '&:hover': {
                      background: 'var(--primary-light)',
                      boxShadow: 'var(--shadow-lg)',
                    },
                  }}
                >
                  Регистрация учителя
                </Button>
              </motion.div>
              
              <motion.div initial="hidden" animate="visible" whileHover="hover" variants={buttonVariants}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)',
                    fontWeight: 600,
                    padding: '12px 30px',
                    borderRadius: 'var(--radius-md)',
                    '&:hover': {
                      borderColor: 'var(--primary-light)',
                      color: 'var(--primary-light)',
                      backgroundColor: 'rgba(26, 35, 126, 0.04)',
                    },
                  }}
                >
                  Войти
                </Button>
              </motion.div>
            </Box>
          </Box>
          
          {/* Карточки с функциями */}
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div 
                  custom={index} 
                  initial="hidden" 
                  animate="visible" 
                  variants={cardVariants}
                >
                  <FeatureCard>
                    <CardContent sx={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                      <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                      <Typography variant="h5" component="h3" fontWeight={600} mb={2} color="var(--text-primary)">
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="var(--text-secondary)">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </FeatureCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </HeroSection>
    </Box>
  );
}

export default HomePage;