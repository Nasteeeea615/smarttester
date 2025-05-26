import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, RadioGroup, Radio, FormControlLabel, Checkbox } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

const TestContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: 250,
  padding: theme.spacing(4),
}));

function StudentTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Декодированный токен:', decoded);
    } catch (err) {
      console.error('Ошибка декодирования токена:', err);
      setError('Неверный токен. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    console.log('Запрашиваем тест с ID:', testId);
    fetch(`/api/tests/${testId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Ответ от сервера:', data);
        setTest(data);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке теста:', err);
        setError(`Не удалось загрузить тест: ${err.message}`);
      });
  }, [testId, navigate]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    const token = localStorage.getItem('token');
    console.log('Отправляемые ответы:', answers);

    if (Object.keys(answers).length === 0) {
      setError('Пожалуйста, выберите хотя бы один ответ.');
      return;
    }

    fetch(`/api/tests/${testId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errorData) => {
            if (res.status === 400 && errorData.message === 'Тест уже был сдан') {
              setError('Тест уже сдан. Перейдите к результатам.');
              setTimeout(() => navigate('/student/results'), 2000); // Перенаправление через 2 секунды
            } else {
              throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.message || 'Неизвестная ошибка'}`);
            }
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log('Результат отправки:', data);
        navigate('/student/results');
      })
      .catch((err) => {
        console.error('Ошибка при отправке теста:', err);
        setError(`Не удалось отправить тест: ${err.message}`);
      });
  };

  if (error) {
    return (
      <TestContainer>
        <Typography color="error">{error}</Typography>
      </TestContainer>
    );
  }

  if (!test) {
    return (
      <TestContainer>
        <Typography>Загрузка теста...</Typography>
      </TestContainer>
    );
  }

  return (
    <>
      <Sidebar role="student" />
      <TestContainer>
        <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44">
          Тест: {test.title}
        </Typography>
        <List>
          {test.questions.map((question) => (
            <ListItem key={question.id} sx={{ mb: 2, background: '#fff', borderRadius: 2, p: 2 }}>
              <ListItemText
                primary={question.question_text}
                secondary={question.image_url && <img src={question.image_url} alt="Question" style={{ maxWidth: '100%' }} />}
              />
              {question.type === 'single' ? (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                >
                  {(question.options || []).map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              ) : question.type === 'multiple' ? (
                (question.options || []).map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={answers[question.id]?.includes(option) || false}
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.checked
                            ? [...(answers[question.id] || []), option]
                            : (answers[question.id] || []).filter((a) => a !== option)
                          )
                        }
                      />
                    }
                    label={option}
                  />
                ))
              ) : null}
            </ListItem>
          ))}
        </List>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ mt: 2, background: '#4a90e2', color: '#fff', '&:hover': { background: '#3a80d2' } }}
        >
          Завершить тест
        </Button>
      </TestContainer>
    </>
  );
}

export default StudentTest;