import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  CircularProgress,
  Paper,
  Grid,
  Alert,
  ListItemText,
  Radio,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  FormGroup,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FormatTextdirectionRToLIcon from '@mui/icons-material/FormatTextdirectionRToL'; // Исправлено
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { InlineMath, BlockMath } from 'react-katex'; // Import KaTeX components
import LatexText from './LatexText';

const ViewContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: isSidebarOpen ? 250 : 0,
  padding: theme.spacing(4),
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: isSidebarOpen ? 200 : 0,
    padding: theme.spacing(2),
  },
}));

const ContentBox = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  background: '#ffffff',
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  background: '#f8fafc',
  boxShadow: 'none',
}));

const OptionText = styled(Typography)(({ theme, isCorrect }) => ({
  fontWeight: isCorrect ? 600 : 400,
  color: isCorrect 
    ? (theme.palette.success && theme.palette.success.dark ? theme.palette.success.dark : 'green') 
    : (theme.palette.text && theme.palette.text.primary ? theme.palette.text.primary : 'black'),
}));

function TeacherViewTest() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите снова.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/tests/view/${testId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            if (res.status === 403) {
              throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
            }
            throw new Error(`Ошибка загрузки теста: ${res.status} ${res.statusText} - ${data.message || ''}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.questions) {
          throw new Error('Некорректные данные теста');
        }
        setTest(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Не удалось загрузить тест: ' + err.message);
          if (err.message.includes('Сессия истекла')) {
            navigate('/login');
          }
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [testId, token, navigate]);

  const handleEdit = useCallback(() => {
    navigate(`/teacher/edit/${testId}`);
  }, [navigate, testId]);

  const renderTextWithMath = (text) => {
    if (!text) return null;
    const parts = text.split(/\\$\$(.*?)\\$\\$|\\$(.*?)\\$/g);
    return parts.map((part, index) => {
      if (index % 4 === 1) { // $$...$$
        return <BlockMath key={index} math={part} />; // Use BlockMath for $$...$$
      } else if (index % 4 === 3) { // $...$
        return <InlineMath key={index} math={part} />; // Use InlineMath for $...$
      } else {
        return part;
      }
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (error) {
    return (
      <ViewContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </ViewContainer>
    );
    }

  if (loading) {
    return (
      <ViewContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </ViewContainer>
    );
  }

  if (!test) {
    return (
      <ViewContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography sx={{ mt: 2 }}>Тест не найден</Typography>
      </ViewContainer>
    );
  }

  return (
    <>
      <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <ViewContainer isSidebarOpen={isSidebarOpen}>
        <ContentBox>
          <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight={700} color="#1a2a44">
              {test.title}
            </Typography>
            <Button
              variant="contained"
              onClick={handleEdit}
              sx={{
                background: '#4a90e2',
                color: '#ffffff',
                '&:hover': { background: '#3a90d2' },
                borderRadius: 8,
                px: 4,
                fontWeight: 600,
              }}
            >
              Редактировать тест
            </Button>
          </Box>

          <Box mb={3}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Класс: {test.class_name || 'Не указан'}
            </Typography>
          </Box>

          <Typography variant="h5" fontWeight={600} mb={3} color="#1a2a44">
            Вопросы:
          </Typography>

          <List>
            {test.questions.map((question, index) => (
              <ListItem
                key={question.id}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: '#f8f9fa',
                }}
              >
                <Typography variant="h6" fontWeight={600} mb={2} color="#1a2a44">
                  Вопрос {index + 1}
                </Typography>
                <Typography variant="body1" mb={2}>
                  <LatexText text={question.question_text} />
            </Typography>
                {question.image_url && (
                  <Box mb={2}>
                    <img
                      src={question.image_url}
                      alt={`Изображение для вопроса ${index + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                    />
                  </Box>
                )}
                {question.type === 'single' ? (
                  <RadioGroup>
                    {question.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.text}
                        control={<Radio disabled />}
                        label={<LatexText text={option.text} />}
                        sx={{
                          mb: 1,
                          '& .MuiFormControlLabel-label': {
                            color: option.is_correct ? '#4caf50' : 'inherit',
                            fontWeight: option.is_correct ? 600 : 'normal',
                          },
                        }}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <FormGroup>
                    {question.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={<Checkbox disabled checked={option.is_correct} />}
                        label={<LatexText text={option.text} />}
                        sx={{
                          mb: 1,
                          '& .MuiFormControlLabel-label': {
                            color: option.is_correct ? '#4caf50' : 'inherit',
                            fontWeight: option.is_correct ? 600 : 'normal',
                          },
                        }}
              />
                    ))}
                  </FormGroup>
          )}
              </ListItem>
            ))}
          </List>
        </ContentBox>
      </ViewContainer>
    </>
  );
}

export default TeacherViewTest;