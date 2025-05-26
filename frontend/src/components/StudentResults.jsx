import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

const ResultsContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: 250,
  padding: theme.spacing(4),
}));

function StudentResults() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    console.log('Запрос результатов с токеном:', token.substring(0, 10) + '...');
    fetch('/api/tests/test-results/student', { // Исправленный URL
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        console.log('Статус ответа:', res.status);
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
        console.error('Ошибка при загрузке результатов:', err);
        setError('Не удалось загрузить результаты: ' + err.message);
      });
  }, [navigate]);

  return (
    <>
      <Sidebar role="student" />
      <ResultsContainer>
        <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
          Мои результаты
        </Typography>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        {results.length === 0 && !error ? (
          <Typography color="textSecondary">
            У вас пока нет результатов.
          </Typography>
        ) : (
          <List>
            {results.map((result) => (
              <ListItem
                key={result.id}
                sx={{
                  borderRadius: '10px',
                  mb: 1,
                  background: '#ffffff',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                }}
              >
                <ListItemText
                  primary={result.title}
                  secondary={
                    result.submitted_at
                      ? `Оценка: ${result.score}/${result.total_possible_score}, Сдано: ${new Date(result.submitted_at).toLocaleDateString()}`
                      : `Оценка: ${result.score}/${result.total_possible_score}`
                  }
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </ResultsContainer>
    </>
  );
}

export default StudentResults;