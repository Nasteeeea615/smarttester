import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Radio,
  Checkbox,
  FormControlLabel,
  FormControl,
  RadioGroup,
  FormGroup,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const TestContainer = styled(Box)(({ theme }) => ({
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

function StudentTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    // Загрузка теста
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

    // Загрузка вопросов
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
        // Инициализация ответов
        const initialAnswers = {};
        data.forEach((q) => {
          initialAnswers[q.id] = q.type === 'single' ? '' : [];
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке вопросов:', err);
        setError('Не удалось загрузить вопросы: ' + err.message);
      });
  }, [testId, navigate]);

  const handleAnswerChange = (questionId, value, checked) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      const question = questions.find((q) => q.id === questionId);
      if (question.type === 'single') {
        newAnswers[questionId] = value;
      } else {
        if (checked) {
          newAnswers[questionId] = [...newAnswers[questionId], value];
        } else {
          newAnswers[questionId] = newAnswers[questionId].filter((ans) => ans !== value);
        }
      }
      return newAnswers;
    });
  };

  const submitTest = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    // Проверка, что все вопросы имеют ответы
    for (const question of questions) {
      if (
        (question.type === 'single' && !answers[question.id]) ||
        (question.type === 'multiple' && answers[question.id].length === 0)
      ) {
        setError('Пожалуйста, ответьте на все вопросы.');
        return;
      }
    }

    try {
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast.success('Тест успешно отправлен!');
      navigate('/student');
    } catch (err) {
      setError('Ошибка при отправке теста: ' + err.message);
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (error) {
    return (
      <TestContainer>
        <ContentBox>
          <Typography color="error">{error}</Typography>
        </ContentBox>
      </TestContainer>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <TestContainer>
        <ContentBox>
          <Typography>Загрузка...</Typography>
        </ContentBox>
      </TestContainer>
    );
  }

  return (
    <>
      <Sidebar role="student" />
      <TestContainer>
        <ContentBox>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700}>
              Тест: {test.title}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{ color: '#4a90e2', borderColor: '#4a90e2' }}
            >
              Выйти
            </Button>
          </Box>
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
              {question.type === 'single' ? (
                <FormControl component="fieldset" sx={{ mt: 1 }}>
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  >
                    {question.options.map((option, optIndex) => (
                      <FormControlLabel
                        key={optIndex}
                        value={option}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ) : (
                <FormGroup sx={{ mt: 1 }}>
                  {question.options.map((option, optIndex) => (
                    <FormControlLabel
                      key={optIndex}
                      control={
                        <Checkbox
                          checked={answers[question.id]?.includes(option) || false}
                          onChange={(e) =>
                            handleAnswerChange(question.id, option, e.target.checked)
                          }
                        />
                      }
                      label={option}
                    />
                  ))}
                </FormGroup>
              )}
            </Box>
          ))}
          <Button
            variant="contained"
            onClick={submitTest}
            sx={{
              background: '#4a90e2',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#3a80d2',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Отправить тест
          </Button>
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </ContentBox>
      </TestContainer>
    </>
  );
}

export default StudentTest;