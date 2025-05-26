import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, CircularProgress, Paper, Chip } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

const ResultsContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #e0e7ff 0%, #f5f7fa 100%)',
  marginLeft: isSidebarOpen ? 250 : 0,
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: isSidebarOpen ? 200 : 0,
    padding: theme.spacing(2),
  },
}));

const ResultCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(80, 80, 200, 0.08)',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

function StudentResults() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    fetch('/api/tests/test-results/student', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(`HTTP error! status: ${res.status}, body: ${text}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setError(data.message || 'Ошибка загрузки результатов');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Не удалось загрузить результаты: ' + err.message);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  const handleViewDetails = useCallback((resultId) => {
    navigate(`/student/results/${resultId}`);
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <>
      <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ResultsContainer isSidebarOpen={isSidebarOpen}>
        <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
          Мои результаты
        </Typography>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        {loading ? (
          <CircularProgress />
        ) : results.length === 0 && !error ? (
          <Typography color="textSecondary">
            У вас пока нет результатов.
          </Typography>
        ) : (
          <List sx={{ width: '100%', maxWidth: 600 }}>
            {results.map((result) => (
              <ResultCard key={result.id} onClick={() => handleViewDetails(result.id)} sx={{ cursor: 'pointer' }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="#1a2a44">
                    {result.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {result.submitted_at
                      ? `Сдано: ${new Date(result.submitted_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                      : 'Не сдано'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    label={`Оценка: ${result.score}/${result.total_possible_score}`}
                    color={result.score / result.total_possible_score > 0.7 ? 'success' : 'warning'}
                    sx={{ fontSize: 18, fontWeight: 700, px: 2, py: 1 }}
                  />
                </Box>
              </ResultCard>
            ))}
          </List>
        )}
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{ mt: 2, borderRadius: 8, fontWeight: 600 }}
        >
          Вернуться к тестам
        </Button>
      </ResultsContainer>
    </>
  );
}

export default StudentResults;