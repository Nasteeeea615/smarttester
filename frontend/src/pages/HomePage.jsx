import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/system';

const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#f5f7fa',
  padding: theme.spacing(4),
  alignItems: 'center',
  justifyContent: 'center',
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
      <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
        <motion.div initial="hidden" animate="visible" whileHover="hover" variants={buttonVariants}>
          <Button
            variant="contained"
            onClick={() => navigate('/register-teacher')}
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
            Регистрация учителя
          </Button>
        </motion.div>
        <motion.div initial="hidden" animate="visible" whileHover="hover" variants={buttonVariants}>
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{
              borderColor: '#4a90e2',
              color: '#4a90e2',
              fontWeight: 700,
              padding: '12px 40px',
              borderRadius: '10px',
              '&:hover': {
                borderColor: '#3a80d2',
                color: '#3a80d2',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Войти
          </Button>
        </motion.div>
      </Box>
    </HeroSection>
  );
}

export default HomePage;