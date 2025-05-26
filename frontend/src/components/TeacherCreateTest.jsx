import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const CreateContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
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

function TeacherCreateTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState({
    title: '',
    classId: '',
    questions: [
      {
        question_text: '',
        type: 'single',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        formula: '',
      },
    ],
  });
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!testId);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (hasNavigated) return;
    if (!token) return;

    const controller = new AbortController();
    setLoading(true);

    const fetchData = async () => {
      try {
        const [classesRes, testRes] = await Promise.all([
      fetch('/api/classes', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
        signal: controller.signal,
      }),
      testId
        ? fetch(`/api/tests/view/${testId}`, {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
            signal: controller.signal,
          })
        : Promise.resolve(null),
        ]);

        if (!classesRes.ok) {
          const errorText = await classesRes.text();
          if (classesRes.status === 403) {
            toast.error('Сессия истекла. Пожалуйста, войдите снова.');
            setHasNavigated(true);
            navigate('/login');
            return;
          }
          throw new Error(`Ошибка загрузки классов: ${errorText}`);
        }
        const classesData = await classesRes.json();
        
        if (!Array.isArray(classesData)) {
          throw new Error('Получены некорректные данные классов');
        }

        if (classesData.length === 0) {
          toast.warning('У вас нет доступных классов. Сначала создайте класс.');
        }

        setClasses(classesData);

        if (testId && testRes) {
          if (!testRes.ok) {
            const errorText = await testRes.text();
            if (testRes.status === 403) {
              toast.error('Сессия истекла. Пожалуйста, войдите снова.');
              setHasNavigated(true);
              navigate('/login');
              return;
            }
            throw new Error(`Ошибка загрузки теста: ${errorText}`);
          }
          const testData = await testRes.json();
          setTest({
            title: testData.title || '',
            classId: testData.class_id || '',
            questions: testData.questions.map((q) => ({
              question_text: q.question_text || '',
              type: q.type || 'single',
              options: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.is_correct,
              })),
              formula: q.formula || '',
            })),
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(`Ошибка: ${err.message}`);
          toast.error(`Ошибка загрузки данных: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [testId, token, navigate, hasNavigated]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'classId') {
      const selectedClass = classes.find(c => c.id === parseInt(value));
      if (!selectedClass) {
        toast.warning('Выбранный класс не найден в списке доступных классов');
        return;
      }
    }

    setTest((prev) => ({ ...prev, [name]: value }));
  }, [classes]);

  const handleQuestionChange = useCallback((index, field, value) => {
    const newQuestions = [...test.questions];
    newQuestions[index][field] = value;
    setTest((prev) => ({ ...prev, questions: newQuestions }));
  }, [test.questions]);

  const handleOptionChange = useCallback((qIndex, optIndex, field, value) => {
    const newQuestions = [...test.questions];
    newQuestions[qIndex].options[optIndex][field] = value;
    setTest((prev) => ({ ...prev, questions: newQuestions }));
  }, [test.questions]);

  const addQuestion = useCallback(() => {
    setTest((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: '',
          type: 'single',
          options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
          formula: '',
        },
      ],
    }));
  }, []);

  const removeQuestion = useCallback((index) => {
    if (test.questions.length === 1) {
      setError('Тест должен содержать хотя бы один вопрос.');
      return;
    } else if (test.questions.length > 1) {
    const newQuestions = test.questions.filter((_, i) => i !== index);
    setTest((prev) => ({ ...prev, questions: newQuestions }));
    }
  }, [test.questions]);

  const addOption = useCallback((qIndex) => {
    const newQuestions = [...test.questions];
    newQuestions[qIndex].options.push({ text: '', isCorrect: false });
    setTest((prev) => ({ ...prev, questions: newQuestions }));
  }, [test.questions]);

  const removeOption = useCallback((qIndex, optIndex) => {
    const newQuestions = [...test.questions];
    if (newQuestions[qIndex].options.length <= 2) {
      setError('Вопрос должен содержать как минимум два варианта ответа.');
      return;
    }
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== optIndex);
    setTest((prev) => ({ ...prev, questions: newQuestions }));
  }, [test.questions]);

  const handleCorrectAnswerChange = useCallback((qIndex, optIndex) => {
    const newQuestions = [...test.questions];
    const question = newQuestions[qIndex];
    if (question.type === 'single') {
      question.options.forEach((opt, i) => {
        opt.isCorrect = i === optIndex;
      });
    } else {
      question.options[optIndex].isCorrect = !question.options[optIndex].isCorrect;
    }
    setTest((prev) => ({ ...prev, questions: newQuestions }));
  }, [test.questions]);

 const handleSubmit = useCallback(async (e) => {
  e.preventDefault();
    if (!token) return;

  if (!test.title.trim()) {
    setError('Название теста обязательно.');
    toast.error('Название теста обязательно.');
    return;
  }

  if (!test.classId) {
    setError('Выберите класс.');
    toast.error('Выберите класс.');
    return;
  }

    const selectedClass = classes.find(c => c.id === parseInt(test.classId));
    if (!selectedClass) {
      setError('Выбранный класс не найден.');
      toast.error('Выбранный класс не найден.');
      return;
    }

    if (test.questions.length === 0) {
      setError('Тест должен содержать хотя бы один вопрос.');
      toast.error('Тест должен содержать хотя бы один вопрос.');
      return;
    }

  for (let qIndex = 0; qIndex < test.questions.length; qIndex++) {
    const q = test.questions[qIndex];
    if (!q.question_text.trim()) {
      setError(`Текст вопроса ${qIndex + 1} обязателен.`);
      toast.error(`Текст вопроса ${qIndex + 1} обязателен.`);
      return;
    }
    if (q.options.length < 2) {
      setError(`Вопрос ${qIndex + 1} должен содержать как минимум два варианта ответа.`);
      toast.error(`Вопрос ${qIndex + 1} должен содержать как минимум два варианта ответа.`);
      return;
    }
    if (!q.options.some((opt) => opt.isCorrect)) {
      setError(`Вопрос ${qIndex + 1} должен иметь хотя бы один правильный ответ.`);
      toast.error(`Вопрос ${qIndex + 1} должен иметь хотя бы один правильный ответ.`);
      return;
    }
    for (let optIndex = 0; optIndex < q.options.length; optIndex++) {
      if (!q.options[optIndex].text.trim()) {
        setError(`Вариант ${optIndex + 1} в вопросе ${qIndex + 1} не может быть пустым.`);
        toast.error(`Вариант ${optIndex + 1} в вопросе ${qIndex + 1} не может быть пустым.`);
        return;
      }
    }
  }

  const formData = new FormData();
  formData.append('title', test.title);
  formData.append('classId', test.classId);

    const questionsData = test.questions.map((q) => {
    let correctAnswer = '';
    let correctAnswers = [];
    if (q.type === 'single') {
      const correctOption = q.options.find((opt) => opt.isCorrect);
      correctAnswer = correctOption ? correctOption.text : '';
    } else if (q.type === 'multiple') {
      correctAnswers = q.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.text);
    }

      return {
      question_text: q.question_text,
      type: q.type,
      options: q.options.map((opt) => opt.text),
      correct_answer: correctAnswer,
      correct_answers: correctAnswers,
      };
  });

    formData.append('questions', JSON.stringify(questionsData));

  const method = isEditing ? 'PUT' : 'POST';
  const url = isEditing ? `/api/tests/edit/${testId}` : '/api/tests';
  try {
    const res = await fetch(url, {
      method,
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      body: formData,
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (jsonError) {
        errorData = { message: await res.text() };
      }
        if (res.status === 403) {
          toast.error('Сессия истекла. Пожалуйста, войдите снова.');
          setHasNavigated(true);
          navigate('/login');
          return;
        }
      throw new Error(`HTTP error! status: ${res.status}, body: ${JSON.stringify(errorData)}`);
    }

      const responseData = await res.json();
    toast.success(`Тест ${isEditing ? 'обновлён' : 'создан'}!`);
      setHasNavigated(true);
    navigate('/teacher');
  } catch (err) {
    setError(`Не удалось сохранить тест: ${err.message}`);
    toast.error(`Ошибка: ${err.message}`);
  }
  }, [test, isEditing, testId, token, navigate, classes, hasNavigated]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (error) {
    return (
      <CreateContainer isSidebarOpen={isSidebarOpen}>
        <Typography color="error">{error}</Typography>
      </CreateContainer>
    );
  }

  if (loading) {
    return (
      <CreateContainer isSidebarOpen={isSidebarOpen}>
        <CircularProgress />
      </CreateContainer>
    );
  }

  return (
    <>
      <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <CreateContainer isSidebarOpen={isSidebarOpen}>
        <Typography variant="h4" fontWeight={700} mb={4} color="#1a2a44" textAlign="center">
          {isEditing ? 'Редактировать тест' : 'Создать новый тест'}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="title"
              label="Название теста"
              value={test.title}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Класс</InputLabel>
              <Select
                name="classId"
                value={test.classId}
                onChange={handleChange}
                label="Класс"
                error={!test.classId}
              >
                {classes.length === 0 ? (
                  <MenuItem disabled>Нет доступных классов</MenuItem>
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {classes.length === 0 && (
                <FormHelperText error>
                  У вас нет доступных классов. Сначала создайте класс.
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        <List>
          {test.questions.map((question, qIndex) => (
            <ListItem
              key={qIndex}
              sx={{
                mb: 2,
                background: '#fff',
                borderRadius: 8,
                p: 3,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <ListItemText
                primary={
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label={`Вопрос ${qIndex + 1}`}
                        value={question.question_text}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, 'question_text', e.target.value)
                        }
                        fullWidth
                        margin="normal"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="normal" variant="outlined">
                        <InputLabel>Тип вопроса</InputLabel>
                        <Select
                          value={question.type}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'type', e.target.value)
                          }
                          label="Тип вопроса"
                        >
                          <MenuItem value="single">Один правильный ответ</MenuItem>
                          <MenuItem value="multiple">Несколько правильных ответов</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1">Варианты ответа:</Typography>
                      {question.type === 'single' ? (
                        <RadioGroup>
                          {question.options.map((option, optIndex) => (
                            <Box key={optIndex} display="flex" alignItems="center">
                              <FormControlLabel
                                control={
                                  <Radio
                                    checked={option.isCorrect}
                                    onChange={() =>
                                      handleCorrectAnswerChange(qIndex, optIndex)
                                    }
                                  />
                                }
                                label={
                                  <TextField
                                    value={option.text}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        qIndex,
                                        optIndex,
                                        'text',
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Вариант ${optIndex + 1}`}
                                    variant="standard"
                                    sx={{ flexGrow: 1 }}
                                  />
                                }
                              />
                              <IconButton
                                onClick={() => removeOption(qIndex, optIndex)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          ))}
                        </RadioGroup>
                      ) : (
                        question.options.map((option, optIndex) => (
                          <Box key={optIndex} display="flex" alignItems="center">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={option.isCorrect}
                                  onChange={() =>
                                    handleCorrectAnswerChange(qIndex, optIndex)
                                  }
                                />
                              }
                              label={
                                <TextField
                                  value={option.text}
                                  onChange={(e) =>
                                    handleOptionChange(
                                      qIndex,
                                      optIndex,
                                      'text',
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Вариант ${optIndex + 1}`}
                                  variant="standard"
                                  sx={{ flexGrow: 1 }}
                                />
                              }
                            />
                            <IconButton
                              onClick={() => removeOption(qIndex, optIndex)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))
                      )}
                      <Button
                        variant="outlined"
                        onClick={() => addOption(qIndex)}
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                      >
                        Добавить вариант
                      </Button>
                    </Grid>
                  </Grid>
                }
                secondary={
                  <IconButton
                    onClick={() => removeQuestion(qIndex)}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              />
            </ListItem>
          ))}
        </List>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addQuestion}
          sx={{
            mt: 2,
            background: '#4a90e2',
            color: '#fff',
            '&:hover': { background: '#3a80d2' },
          }}
        >
          Добавить вопрос
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            mt: 2,
            ml: 2,
            background: '#4a90e2',
            color: '#fff',
            '&:hover': { background: '#3a80d2' },
          }}
        >
          {isEditing ? 'Сохранить изменения' : 'Создать тест'}
        </Button>
      </CreateContainer>
    </>
  );
}

export default TeacherCreateTest;