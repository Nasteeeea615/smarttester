import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  LinearProgress,
  Paper,
  Fade,
  Alert,
  List,
  ListItem,
  ListItemText,
  FormGroup,
} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import LatexText from './LatexText';

const TestContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  padding: theme.spacing(4),
  marginLeft: isSidebarOpen ? 250 : 0,
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: isSidebarOpen ? 200 : 0,
    padding: theme.spacing(2),
  },
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  margin: '0 auto',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(80, 80, 200, 0.08)',
  background: '#fff',
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(80, 80, 200, 0.15)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    maxWidth: '100%',
  },
}));

const ProgressBox = styled(Box)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(3),
}));

function StudentTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите снова.');
      setLoading(false);
      navigate('/login');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/tests/student/${testId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Ошибка при загрузке теста: ${res.status} ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
          setTest(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(`Не удалось загрузить тест: ${err.message}`);
          toast.error(`Ошибка: ${err.message}`);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [testId, token, navigate]);

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleMultiAnswerChange = useCallback((questionId, value, checked) => {
    setAnswers((prev) => {
      const prevArr = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      return {
        ...prev,
        [questionId]: checked
          ? [...prevArr, value]
          : prevArr.filter((v) => v !== value),
      };
    });
  }, []);

  const handleNext = () => {
    setCurrent((prev) => Math.min(prev + 1, (test?.questions?.length || 0) - 1));
  };

  const handlePrev = () => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = useCallback(() => {
    if (Object.keys(answers).length === 0) {
      setError('Пожалуйста, выберите хотя бы один ответ.');
      return;
    }
    setIsSubmitting(true);
    fetch(`/api/tests/${testId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    })
      .then(async (res) => {
        if (!res.ok) {
          let errorText = await res.text();
          throw new Error(`Ошибка при отправке теста: ${res.status} ${errorText}`);
        }
        return res.json();
      })
      .then(() => {
        toast.success('Тест успешно сдан!', { autoClose: 3000 });
        setTimeout(() => navigate('/student/results'), 2000);
      })
      .catch((err) => {
        setError(`Не удалось отправить тест: ${err.message}`);
        toast.error(`Ошибка: ${err.message}`, { autoClose: 5000 });
      })
      .finally(() => setIsSubmitting(false));
  }, [answers, testId, token, navigate]);

  const renderTextWithMath = (text) => {
    if (!text) return 'Текст отсутствует';
    try {
      const parts = text.split(/&(.*?)&/g);
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          return <InlineMath key={index} math={part} />;
        }
        return part;
      });
    } catch (err) {
      console.error('Ошибка в renderTextWithMath:', err, 'Text:', text);
      return text;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (error) {
    return (
      <TestContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>
          {error}
        </Typography>
      </TestContainer>
    );
  }

  if (loading) {
    return (
      <TestContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
        </Box>
      </TestContainer>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <TestContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography sx={{ mt: 4, textAlign: 'center' }}>
          Тест или вопросы не загружены.
        </Typography>
      </TestContainer>
    );
  }

  const total = test.questions.length;
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  const question = test.questions[current];

  if (!question) {
    return (
      <TestContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography color="error" sx={{ mt: 4, textAlign: 'center' }}>
          Ошибка: Вопрос для отображения не найден. Current: {current}, Length: {test.questions.length}
        </Typography>
      </TestContainer>
    );
  }

  return (
    <TestContainer isSidebarOpen={isSidebarOpen}>
      <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {test?.title || 'Без названия'}
          </Typography>
          <ProgressBox>
            <Typography variant="h6" color="#4a90e2" mb={1}>
              Вопрос {current + 1} из {total}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
          </ProgressBox>
          <Fade in>
            <QuestionCard>
              <Typography variant="h5" fontWeight={700} mb={2} color="#1a2a44">
                <LatexText text={question.question_text} />
        </Typography>
              {question.image_url && (
                <Box mb={2}>
                  <img
                    src={question.image_url}
                    alt={`Изображение для вопроса ${current + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '300px' }}
                  />
                </Box>
              )}
              {question.type === 'single' && question.options?.length > 0 ? (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  >
                  {question.options.map((option) => (
                      <FormControlLabel
                      key={option.id}
                      value={option.text}
                        control={<Radio />}
                      label={<LatexText text={option.text} />}
                      sx={{
                        background: answers[question.id] === option.text ? '#e3f2fd' : 'transparent',
                        borderRadius: 2,
                        px: 2,
                        my: 1,
                        transition: 'background 0.2s',
                      }}
                      />
                    ))}
                  </RadioGroup>
              ) : question.type === 'multiple' && question.options?.length > 0 ? (
                <FormGroup>
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={answers[question.id]?.includes(option.text) || false}
                          onChange={(e) => handleMultiAnswerChange(question.id, option.text, e.target.checked)}
                        />
                      }
                      label={<LatexText text={option.text} />}
                      sx={{
                        background: answers[question.id]?.includes(option.text) ? '#e3f2fd' : 'transparent',
                        borderRadius: 2,
                        px: 2,
                        my: 1,
                        transition: 'background 0.2s',
                      }}
                    />
                  ))}
                </FormGroup>
              ) : (
                <Typography color="error">Тип вопроса не поддерживается или нет вариантов ответа.</Typography>
              )}
            </QuestionCard>
          </Fade>
          <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" maxWidth={800} mx="auto" mt={2}>
            <Button
              variant="outlined"
              onClick={handlePrev}
              disabled={current === 0}
              sx={{ borderRadius: 8, px: 4, fontWeight: 600 }}
            >
              Назад
            </Button>
            {current < total - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ borderRadius: 8, px: 4, fontWeight: 600, background: '#4a90e2' }}
              >
                Далее
              </Button>
            ) : (
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
                sx={{ borderRadius: 8, px: 4, fontWeight: 600, background: '#10b981' }}
        >
          {isSubmitting ? 'Отправка...' : 'Завершить тест'}
        </Button>
            )}
          </Box>
        </Paper>
      </Box>
      </TestContainer>
  );
}

export default StudentTest;