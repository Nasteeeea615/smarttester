import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const ViewContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: 250,
  padding: theme.spacing(4),
}));

const ContentBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

function TeacherViewTest() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    fetch(`/api/tests/${testId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка загрузки теста: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setTest(data);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке теста:', err);
        setError('Не удалось загрузить тест: ' + err.message);
      });

    fetch(`/api/tests/${testId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка загрузки вопросов: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке вопросов:', err);
        setError('Не удалось загрузить вопросы: ' + err.message);
      });
  }, [testId, navigate]);

  if (error) {
    return (
      <ViewContainer>
        <ContentBox>
          <Typography color="error">{error}</Typography>
        </ContentBox>
      </ViewContainer>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <ViewContainer>
        <ContentBox>
          <Typography>Загрузка...</Typography>
        </ContentBox>
      </ViewContainer>
    );
  }

  return (
    <>
      <Sidebar role="teacher" />
      <ViewContainer>
        <ContentBox>
          <Box mb={3}>
            <Typography variant="h5" fontWeight={700}>
              Тест: {test.title}
            </Typography>
          </Box>
          <Typography variant="body1" mb={2}>
            Класс: {test.class_name}
          </Typography>
          {questions.map((question, index) => (
            <Box key={question.id} mb={4}>
              {question.image_url && (
                <Box mb={2}>
                  <img
                    src={question.image_url}
                    alt="Question"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '5px' }}
                  />
                </Box>
              )}
              <Typography variant="body1" fontWeight={500}>
                {index + 1}. {question.question_text}
              </Typography>
              <Box mt={1}>
                {question.options.map((option, optIndex) => (
                  <Typography key={optIndex} variant="body2">
                    {optIndex + 1}. {option}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Правильный ответ: {question.type === 'single' ? question.correct_answer : question.correct_answers.join(', ')}
              </Typography>
            </Box>
          ))}
          <Button
            variant="contained"
            onClick={() => navigate('/teacher')}
            sx={{
              background: '#1a237e', // Тёмно-синий цвет
              color: '#ffffff',
              '&:hover': {
                background: '#3f51b5', // Чуть светлее тёмно-синего при наведении
              },
            }}
          >
            Назад
          </Button>
        </ContentBox>
      </ViewContainer>
    </>
  );
}

export default TeacherViewTest;