import { useState, useEffect } from 'react';
import { Box, Typography, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox } from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const DashboardContainer = styled(Box)(({ theme }) => ({
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

function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [className, setClassName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tests', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => setTests(data))
      .catch((err) => console.error(err));

    fetch('/api/auth/classes', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((classes) => {
        const user = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
        const userClass = classes.find((cls) => cls.id === user.class_id);
        setClassName(userClass ? userClass.name : 'Не указан');
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchQuestions = async (testId) => {
    try {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
        setSelectedTest(testId);
        setAnswers({});
      } else {
        setError(data.message || 'Ошибка загрузки вопросов');
      }
    } catch (err) {
      setError('Ошибка сервера: ' + err.message);
      console.error(err);
    }
  };

  const handleAnswerChange = (questionId, value, checked) => {
    setAnswers((prev) => {
      const question = questions.find((q) => q.id === questionId);
      if (question.type === 'single') {
        return { ...prev, [questionId]: value };
      } else {
        const currentAnswers = prev[questionId] || [];
        if (checked) {
          return { ...prev, [questionId]: [...currentAnswers, value] };
        } else {
          return { ...prev, [questionId]: currentAnswers.filter((ans) => ans !== value) };
        }
      }
    });
  };

  const submitTest = async () => {
    try {
      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          test_id: selectedTest,
          answers,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Тест отправлен! Результат: ${data.score}/${data.total}`);
        setSelectedTest(null);
        setQuestions([]);
        setAnswers({});
      } else {
        setError(data.message || 'Ошибка отправки теста');
      }
    } catch (err) {
      setError('Ошибка сервера: ' + err.message);
      console.error(err);
    }
  };

  return (
    <>
      <Sidebar role="student" />
      <DashboardContainer>
        <ContentBox>
          <Typography variant="h5" fontWeight={700} mb={3} color="#1a2a44">
            Мои тесты
          </Typography>
          <Typography variant="body1" mb={3} color="#6b7280">
            Класс: {className}
          </Typography>
          {!selectedTest ? (
            <>
              {tests.length === 0 ? (
                <Typography color="#1a2a44">Нет доступных тестов</Typography>
              ) : (
                tests.map((test) => (
                  <Box key={test.id} mb={3} p={3} borderRadius="10px" bgcolor="#f5f7fa">
                    <Typography variant="h6" fontWeight={500} color="#1a2a44">
                      {test.title}
                    </Typography>
                    <Typography variant="body2" color="#6b7280">
                      Учитель: {test.teacher_name}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => fetchQuestions(test.id)}
                      sx={{
                        mt: 2,
                        background: '#4a90e2',
                        color: '#ffffff',
                        fontWeight: 700,
                        borderRadius: '10px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        '&:hover': {
                          background: '#3a80d2',
                          boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
                        },
                      }}
                    >
                      Начать тест
                    </Button>
                  </Box>
                ))
              )}
            </>
          ) : (
            <>
              {questions.map((question) => (
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
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ color: '#1a2a44' }}>
                      {question.question_text}
                    </FormLabel>
                    {question.type === 'single' ? (
                      <RadioGroup
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      >
                        {question.options.map((option, index) => (
                          <FormControlLabel
                            key={index}
                            value={option}
                            control={<Radio />}
                            label={option}
                            sx={{ color: '#1a2a44' }}
                          />
                        ))}
                      </RadioGroup>
                    ) : (
                      question.options.map((option, index) => (
                        <FormControlLabel
                          key={index}
                          control={
                            <Checkbox
                              checked={(answers[question.id] || []).includes(option)}
                              onChange={(e) =>
                                handleAnswerChange(question.id, option, e.target.checked)
                              }
                            />
                          }
                          label={option}
                          sx={{ color: '#1a2a44' }}
                        />
                      ))
                    )}
                  </FormControl>
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
              <Button
                variant="text"
                onClick={() => {
                  setSelectedTest(null);
                  setQuestions([]);
                  setAnswers({});
                }}
                sx={{ ml: 2, color: '#4a90e2' }}
              >
                Назад
              </Button>
            </>
          )}
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </ContentBox>
      </DashboardContainer>
    </>
  );
}

export default StudentDashboard;