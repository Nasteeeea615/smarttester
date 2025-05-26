import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FormatTextdirectionRToLIcon from '@mui/icons-material/FormatTextdirectionRToL'; // Исправлено
import 'katex/dist/katex.min.css'; // Import KaTeX CSS
import { InlineMath, BlockMath } from 'react-katex'; // Import KaTeX components

const DetailsContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
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

const ContentBox = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 800,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  background: '#ffffff',
}));

const QuestionCard = styled(Paper)(({ theme, isCorrect }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  background: isCorrect ? '#e8f5e9' : '#ffebee',
  borderLeft: isCorrect ? '6px solid #4caf50' : '6px solid #f44336',
  boxShadow: 'none',
}));

const AnswerOption = styled(Box)(({ theme, isCorrect, isSelected }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(0.5, 0),
  borderRadius: theme.spacing(1),
  backgroundColor: isCorrect 
    ? theme.palette.success.light 
    : isSelected 
      ? theme.palette.error.light 
      : theme.palette.grey[100],
  border: `1px solid ${
    isCorrect 
      ? theme.palette.success.main 
      : isSelected 
        ? theme.palette.error.main 
        : theme.palette.grey[300]
  }`,
}));

const StatusBox = styled(Box)(({ theme, isCorrect }) => ({
  display: 'flex',
  alignItems: 'center',
  mt: 2,
}));

function SubmissionDetails() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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

    fetch(`/api/tests/submission/${submissionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            if (res.status === 403) {
              throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
            }
            throw new Error(`HTTP error! status: ${res.status}, message: ${data.message || res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.questions) {
          throw new Error('Некорректные данные отправки');
        }
        setSubmission(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(`Не удалось загрузить детали: ${err.message}`);
          if (err.message.includes('Сессия истекла')) {
            navigate('/login');
          }
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [submissionId, token, navigate]);

  const handleBack = useCallback(() => {
    navigate('/student/results');
  }, [navigate]);

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
      <DetailsContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </DetailsContainer>
    );
  }

  if (loading || !submission) {
    return (
      <DetailsContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
        </Box>
      </DetailsContainer>
    );
  }

  const { submission: submissionData, questions } = submission;
  const totalPossibleScore = submissionData.total_possible_score || questions.length;
  const percentage = totalPossibleScore > 0 ? ((submissionData.score / totalPossibleScore) * 100).toFixed(1) : 0;

  return (
    <>
      <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <DetailsContainer isSidebarOpen={isSidebarOpen}>
        <ContentBox>
          <Typography variant="h4" fontWeight={700} mb={3} color="#1a2a44" textAlign="center">
            Детали теста: {submissionData.title || 'Не указан'}
        </Typography>
          <Box display="flex" justifyContent="center" mb={4}>
            <Chip
              label={`Оценка: ${submissionData.score || 0}/${totalPossibleScore} (${percentage}%)`}
              color={percentage > 70 ? 'success' : percentage > 40 ? 'warning' : 'error'}
              sx={{ fontSize: 18, fontWeight: 700, px: 2, py: 2 }}
            />
          </Box>

          <Typography variant="h5" fontWeight={600} mb={3} color="#1a2a44">
            Вопросы и ответы:
        </Typography>

        <List>
            {questions && questions.length > 0 ? (
              questions.map((question, index) => {
                const studentAnswerValue = submissionData.answers[question.id.toString()];
                const isCorrect = submissionData.score > 0 && submissionData.total_possible_score > 0
                  ? (submissionData.score / submissionData.total_possible_score) * questions.length > index
                  : false;

                let isStudentAnswerCorrect = false;
                if (question.type === 'single') {
                  const correctOption = question.options.find(opt => opt.is_correct);
                  const studentOption = question.options.find(opt => opt.text === studentAnswerValue);
                  isStudentAnswerCorrect = correctOption && studentOption
                    ? correctOption.id === studentOption.id
                    : (!correctOption && !studentAnswerValue);
                } else if (question.type === 'multiple') {
                  const correctOptions = question.options.filter(opt => opt.is_correct).map(opt => opt.text);
                  const studentAnswersArray = Array.isArray(studentAnswerValue) ? studentAnswerValue : [];
                  isStudentAnswerCorrect = studentAnswersArray.length === correctOptions.length &&
                    studentAnswersArray.every(answer => correctOptions.includes(answer)) &&
                    correctOptions.every(answer => studentAnswersArray.includes(answer));
                }

                return (
                  <QuestionCard key={question.id} isCorrect={isStudentAnswerCorrect}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Вопрос {index + 1}: {renderTextWithMath(question.question_text || 'Без текста')}
                    </Typography>
                    {question.formula && (
                      <Box display="flex" alignItems="center" mb={2}>
                        <FormatTextdirectionRToLIcon color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          Формула: {question.formula}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="subtitle1" fontWeight={600} mb={1}>Варианты ответа:</Typography>
                    <List dense>
                      {question.options && question.options.length > 0 ? (
                        question.options.map((option, optIndex) => {
                          const isStudentSelection = Array.isArray(studentAnswerValue)
                            ? studentAnswerValue.includes(option.text)
                            : studentAnswerValue === option.text;

            return (
                            <AnswerOption
                              key={option.id}
                              sx={{
                                backgroundColor: option.is_correct 
                                  ? 'success.light' 
                                  : isStudentSelection 
                                    ? 'error.light' 
                                    : 'grey.100',
                                borderColor: option.is_correct 
                                  ? 'success.main' 
                                  : isStudentSelection 
                                    ? 'error.main' 
                                    : 'grey.300',
                              }}
                            >
                              {option.text}
                            </AnswerOption>
                          );
                        })
                      ) : (
                        <Typography>Нет вариантов ответа</Typography>
                      )}
                    </List>

                    <StatusBox isCorrect={isStudentAnswerCorrect}>
                      {isStudentAnswerCorrect ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                      <Typography sx={{ ml: 1 }}>
                        {isStudentAnswerCorrect ? 'Правильно' : 'Неправильно'}
                      </Typography>
                    </StatusBox>
                  </QuestionCard>
            );
              })
            ) : (
              <Typography>У этой отправки нет вопросов.</Typography>
            )}
        </List>
        </ContentBox>
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{ mt: 4, borderRadius: 8, fontWeight: 600, borderColor: '#4a90e2', color: '#4a90e2' }}
        >
          Назад к результатам
        </Button>
      </DetailsContainer>
    </>
  );
}

export default SubmissionDetails;