import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/system';
import { useDropzone } from 'react-dropzone';
import { MdAttachFile } from 'react-icons/md';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

const CreateContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: 250,
  padding: theme.spacing(4),
}));

const FormBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const DropzoneArea = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? '#50c878' : '#1a237e'}`,
  borderRadius: '5px',
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  marginTop: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: isDragActive ? '#e6f4ea' : '#f9f9f9',
  transition: 'background-color 0.3s ease, border-color 0.3s ease',
  '&:hover': {
    backgroundColor: '#f0f4f8',
    borderColor: '#50c878',
  },
}));

const PreviewImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '150px',
  borderRadius: '5px',
  marginTop: '10px',
  objectFit: 'contain',
});

function QuestionDropzone({ question, onImageChange }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onImageChange(acceptedFiles[0]);
      }
    },
  });

  return (
    <DropzoneArea isDragActive={isDragActive}>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Box display="flex" alignItems="center" gap={1}>
          <MdAttachFile style={{ color: '#1a237e', fontSize: '24px' }} />
          <Typography variant="body2" color={isDragActive ? 'success.main' : 'text.primary'}>
            {isDragActive
              ? 'Отпустите файл здесь'
              : question.image
              ? question.image.name
              : question.image_url
              ? 'Изображение загружено'
              : 'Перетащите изображение или нажмите для выбора'}
          </Typography>
        </Box>
        {(question.image || question.image_url) && (
          <PreviewImage
            src={question.image ? URL.createObjectURL(question.image) : question.image_url}
            alt="Preview"
          />
        )}
      </div>
    </DropzoneArea>
  );
}

function TeacherCreateTest() {
  const { testId } = useParams();
  const isEditMode = !!testId;
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      correct_answers: [],
      type: 'single',
      image: null,
      image_url: null,
    },
  ]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    fetch('/api/classes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка загрузки классов: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Полученные классы:', data);
        setClasses(data);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке классов:', err);
        setError('Не удалось загрузить классы: ' + err.message);
      });

    if (isEditMode) {
      fetch(`/api/tests/${testId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Ошибка загрузки теста: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((test) => {
          setTitle(test.title);
          setClassId(test.class_id.toString());
          fetch(`/api/tests/${testId}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Ошибка загрузки вопросов: ${res.status} ${res.statusText}`);
              }
              return res.json();
            })
            .then((questionsData) => {
              setQuestions(
                questionsData.map((q) => ({
                  question_text: q.question_text,
                  options: q.options,
                  correct_answer: q.correct_answer || '',
                  correct_answers: q.correct_answers || [],
                  type: q.type,
                  image: null,
                  image_url: q.image_url,
                }))
              );
            })
            .catch((err) => {
              console.error('Ошибка при загрузке вопросов:', err);
              setError('Не удалось загрузить вопросы: ' + err.message);
              // Если вопросы не найдены, можно оставить пустой массив
              setQuestions([
                {
                  question_text: '',
                  options: ['', '', '', ''],
                  correct_answer: '',
                  correct_answers: [],
                  type: 'single',
                  image: null,
                  image_url: null,
                },
              ]);
            });
        })
        .catch((err) => {
          console.error('Ошибка при загрузке теста:', err);
          setError('Не удалось загрузить тест: ' + err.message);
          navigate('/teacher'); // Перенаправляем, если тест не найден
        });
    }
  }, [navigate, testId, isEditMode]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        correct_answers: [],
        type: 'single',
        image: null,
        image_url: null,
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'question_text' || field === 'type' || field === 'correct_answer') {
      newQuestions[index][field] = value;
    } else if (field === 'options') {
      newQuestions[index].options = value;
    } else if (field === 'correct_answers') {
      newQuestions[index].correct_answers = value;
    } else if (field === 'image') {
      newQuestions[index].image = value;
      newQuestions[index].image_url = value ? URL.createObjectURL(value) : null;
    } else {
      newQuestions[index].options[field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleOptionChange = (index, optIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[index].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (index, value, checked) => {
    const newQuestions = [...questions];
    if (newQuestions[index].type === 'single') {
      newQuestions[index].correct_answer = value;
    } else {
      if (checked) {
        newQuestions[index].correct_answers = [...newQuestions[index].correct_answers, value];
      } else {
        newQuestions[index].correct_answers = newQuestions[index].correct_answers.filter(
          (answer) => answer !== value
        );
      }
    }
    setQuestions(newQuestions);
  };

  const saveTest = async () => {
    if (
      !title ||
      !classId ||
      questions.some(
        (q) =>
          !q.question_text ||
          q.options.some((o) => !o) ||
          (q.type === 'single' && !q.correct_answer) ||
          (q.type === 'multiple' && q.correct_answers.length === 0)
      )
    ) {
      setError('Заполните все поля!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('class_id', parseInt(classId));
    formData.append('questions', JSON.stringify(questions));

    questions.forEach((q, index) => {
      if (q.image) {
        formData.append(`images[${index}]`, q.image);
      }
    });

    try {
      const url = isEditMode ? `/api/tests/${testId}` : '/api/tests';
      const method = isEditMode ? 'PUT' : 'POST';
      console.log('Отправляемые данные:', { title, class_id: parseInt(classId), questions });
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      console.log('Ответ сервера:', text);

      if (!response.ok) {
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`Сервер вернул не JSON: ${text}`);
        }

        if (response.status === 403 && data.message === 'Недействительный токен') {
          setError('Сессия истекла. Пожалуйста, войдите заново.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(isEditMode ? 'Тест обновлён!' : 'Тест создан!');
      setTitle('');
      setClassId('');
      setQuestions([
        {
          question_text: '',
          options: ['', '', '', ''],
          correct_answer: '',
          correct_answers: [],
          type: 'single',
          image: null,
          image_url: null,
        },
      ]);
      navigate('/teacher');
    } catch (err) {
      setError('Ошибка сервера: ' + err.message);
      console.error(err);
    }
  };

  const previewTest = () => {
    setIsPreviewing(true);
  };

  return (
    <>
      <Sidebar role="teacher" />
      <CreateContainer>
        <FormBox>
          <Box mb={3}>
            <Typography variant="h5" fontWeight={700}>
              {isEditMode ? 'Редактировать тест' : 'Создать тест'}
            </Typography>
          </Box>
          {error && (
            <Typography color="error" mb={2}>
              {error}
            </Typography>
          )}
          <TextField
            label="Название теста"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ background: '#f5f7fa', borderRadius: '5px' }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel sx={{ top: '-6px' }}>Класс</InputLabel>
            <Select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              variant="outlined"
              sx={{ background: '#f5f7fa', borderRadius: '5px' }}
            >
              {classes.length === 0 ? (
                <MenuItem disabled>Классы не найдены</MenuItem>
              ) : (
                classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          {questions.map((q, index) => (
            <Box key={index} mb={4} p={3} borderRadius="10px" bgcolor="#f5f7fa">
              <FormControl fullWidth margin="normal">
                <InputLabel sx={{ top: '-6px' }}>Тип вопроса</InputLabel>
                <Select
                  value={q.type}
                  onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                  variant="outlined"
                  sx={{ background: '#ffffff', borderRadius: '5px' }}
                >
                  <MenuItem value="single">Один правильный ответ</MenuItem>
                  <MenuItem value="multiple">Несколько правильных ответов</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={`Вопрос ${index + 1}`}
                value={q.question_text}
                onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{ background: '#ffffff', borderRadius: '5px' }}
              />
              {q.options.map((option, optIndex) => (
                <TextField
                  key={optIndex}
                  label={`Вариант ${optIndex + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  sx={{ background: '#ffffff', borderRadius: '5px' }}
                  InputProps={{
                    endAdornment: option && (
                      <FormControlLabel
                        control={
                          q.type === 'single' ? (
                            <Radio
                              checked={q.correct_answer === option}
                              onChange={(e) =>
                                handleQuestionChange(index, 'correct_answer', option)
                              }
                            />
                          ) : (
                            <Checkbox
                              checked={q.correct_answers.includes(option)}
                              onChange={(e) =>
                                handleCorrectAnswerChange(index, option, e.target.checked)
                              }
                            />
                          )
                        }
                        label="Правильный"
                      />
                    ),
                  }}
                />
              ))}
              <QuestionDropzone
                question={q}
                onImageChange={(image) => handleQuestionChange(index, 'image', image)}
              />
              {(q.image || q.image_url) && (
                <Button
                  variant="text"
                  color="error"
                  onClick={() => handleQuestionChange(index, 'image', null)}
                  sx={{ mt: 1 }}
                >
                  Удалить изображение
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="contained"
            onClick={addQuestion}
            sx={{
              background: '#50c878',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              mr: 2,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#40b868',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Добавить вопрос
          </Button>
          <Button
            variant="contained"
            onClick={previewTest}
            sx={{
              background: '#1a237e',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              mr: 2,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#3f51b5',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Предпросмотр
          </Button>
          <Button
            variant="contained"
            onClick={saveTest}
            sx={{
              background: '#1a237e',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#3f51b5',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            Сохранить
          </Button>
        </FormBox>
      </CreateContainer>

      <Dialog open={isPreviewing} onClose={() => setIsPreviewing(false)} maxWidth="md" fullWidth>
        <DialogTitle>Предпросмотр теста</DialogTitle>
        <DialogContent>
          <Typography variant="h6" fontWeight={700} mb={2}>
            {title}
          </Typography>
          {questions.map((q, index) => (
            <Box key={index} mb={4}>
              {q.image_url && (
                <Box mb={2}>
                  <img
                    src={q.image ? URL.createObjectURL(q.image) : q.image_url}
                    alt="Question"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '5px' }}
                  />
                </Box>
              )}
              <Typography variant="body1" fontWeight={500}>
                {index + 1}. {q.question_text}
              </Typography>
              {q.options.map((option, optIndex) => (
                <Box key={optIndex} display="flex" alignItems="center" mt={1}>
                  {q.type === 'single' ? (
                    <Radio checked={q.correct_answer === option} disabled />
                  ) : (
                    <Checkbox checked={q.correct_answers.includes(option)} disabled />
                  )}
                  <Typography>{option}</Typography>
                </Box>
              ))}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewing(false)} color="primary">
            Закрыть
          </Button>
          <Button onClick={saveTest} color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TeacherCreateTest;