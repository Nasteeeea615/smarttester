import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/system';

const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f7fa',
  padding: theme.spacing(4),
  alignItems: 'center', // Центрируем по горизонтали
  justifyContent: 'center', // Центрируем по вертикали
}));

const RoleCard = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  color: '#1a2a44',
  borderRadius: '15px',
  padding: theme.spacing(3),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 229, 255, 0.3)',
  },
}));

function HomePage() {
  const navigate = useNavigate();

  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.5, ease: 'easeOut' } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, delay: 1, ease: 'easeOut' } },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
    hover: { scale: 1.05, transition: { duration: 0.3 } },
  };

  return (
    <HeroSection>
      <motion.div initial="hidden" animate="visible" variants={titleVariants}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '3.5rem' },
            color: '#1a2a44',
            textAlign: 'center',
          }}
        >
          SmartTester
        </Typography>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={subtitleVariants}>
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            mb: 4,
            fontSize: { xs: '1rem', md: '1.25rem' },
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Платформа для создания, прохождения и анализа тестов
        </Typography>
      </motion.div>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 3,
          mt: 4,
          mb: 4, // Добавляем отступ перед кнопкой "Войти"
        }}
      >
        {[
          { title: 'Учитель', description: 'Создавайте тесты и анализируйте результаты', role: 'teacher' },
          { title: 'Ученик', description: 'Проходите тесты и проверяйте свои знания', role: 'student' },
          { title: 'Родитель', description: 'Следите за успехами своего ребёнка', role: 'parent' },
        ].map((role) => {
          const { ref, inView } = useInView({
            triggerOnce: true,
            threshold: 0.3,
          });

          return (
            <motion.div
              key={role.title}
              ref={ref}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              whileHover="hover"
              variants={cardVariants}
            >
              <RoleCard onClick={() => navigate(`/register?role=${role.role}`)}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {role.title}
                </Typography>
                <Typography variant="body2" color="#6b7280">
                  {role.description}
                </Typography>
              </RoleCard>
            </motion.div>
          );
        })}
      </Box>
      <motion.div initial="hidden" animate="visible" whileHover="hover" variants={buttonVariants}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')} // Перенаправляем на страницу входа
          sx={{
            background: '#4a90e2',
            color: '#ffffff',
            fontWeight: 700,
            padding: '12px 40px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              background: '#3a80d2',
              boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
            },
          }}
        >
          Войти
        </Button>
      </motion.div>
    </HeroSection>
  );
}

export default HomePage;