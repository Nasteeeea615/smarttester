import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Paper, List, ListItem, ListItemText, Collapse, Button, Chip, Divider, Grid } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GradeIcon from '@mui/icons-material/Grade';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const CompletedTestsContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
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
  marginBottom: theme.spacing(4),
}));

const TestHeader = styled(Box)(({ theme }) => ({
    background: '#e0e0e0',
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': { background: '#d5d5d5' },
}));

const SubmissionItem = styled(ListItem)(({ theme }) => ({
    background: '#f5f5f5',
    borderRadius: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    '&:hover': { background: '#eeeeee' },
    borderLeft: '4px solid #90caf9',
}));

function StudentCompletedTests() {
  const navigate = useNavigate();
  const [completedSubmissions, setCompletedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openTests, setOpenTests] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите снова.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch('/api/tests/test-results/student', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
             if (res.status === 403) {
                toast.error('Сессия истекла. Пожалуйста, войдите снова.');
                navigate('/login');
             }
            throw new Error(`Ошибка загрузки результатов: ${res.status} ${res.statusText} - ${data.message || ''}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
           console.error('Полученные данные не являются массивом:', data);
           throw new Error('Некорректные данные результатов тестов');
        }
        console.log('Полученные данные:', JSON.stringify(data, null, 2));
        // Group submissions by test title
        const groupedByTest = data.reduce((acc, submission) => {
            console.log('Обработка submission:', JSON.stringify(submission, null, 2));
            const testTitle = submission.test_title && submission.test_title.trim() !== '' ? submission.test_title : `Тест ID: ${submission.test_id || 'неизвестен'}`;
            console.log('Определенный testTitle:', testTitle, 'test_title:', submission.test_title, 'test_id:', submission.test_id);
            if (!acc[testTitle]) {
                acc[testTitle] = [];
            }
            acc[testTitle].push(submission);
            return acc;
        }, {});
        console.log('Сгруппированные данные:', JSON.stringify(groupedByTest, null, 2));

        // Sort submissions within each test group by submitted_at (latest first)
        Object.keys(groupedByTest).forEach(testTitle => {
            groupedByTest[testTitle].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        });

        setCompletedSubmissions(groupedByTest);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Не удалось загрузить результаты тестов: ' + err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [token, navigate]);

  const handleTestClick = (testTitle) => {
    setOpenTests(prevState => ({
      ...prevState,
      [testTitle]: !prevState[testTitle]
    }));
  };

  const handleSubmissionClick = (submissionId) => {
    navigate(`/student/results/${submissionId}`);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (error) {
    return (
      <CompletedTestsContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </CompletedTestsContainer>
    );
  }

  if (loading) {
    return (
      <CompletedTestsContainer isSidebarOpen={isSidebarOpen}>
        <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </CompletedTestsContainer>
    );
  }

  const testTitles = Object.keys(completedSubmissions);

  return (
    <>
      <Sidebar role="student" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <CompletedTestsContainer isSidebarOpen={isSidebarOpen}>
        <ContentBox>
          <Typography variant="h4" fontWeight={700} mb={4} color="#1a2a44" textAlign="center">
            Пройденные тесты
          </Typography>

          {testTitles.length > 0 ? (
            <List>
              {testTitles.map((testTitle) => (
                <React.Fragment key={testTitle}>
                  <TestHeader onClick={() => handleTestClick(testTitle)}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6" fontWeight={600} color="#212121">{testTitle}</Typography>
                    </Box>
                    {openTests[testTitle] ? <ExpandLess /> : <ExpandMore />}
                  </TestHeader>
                  <Collapse in={openTests[testTitle]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {completedSubmissions[testTitle].map((submission, index, arr) => (
                        <SubmissionItem sx={{ pl: 4 }} key={submission.id}>
                           <ListItemText 
                             primary={
                                <Box display="flex" alignItems="center">
                                   <Typography variant="body1" fontWeight={500}>Попытка {arr.length - index}</Typography>
                                   {testTitle.startsWith('Тест ID:') && (
                                     <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                                       ID теста: {submission.test_id || 'неизвестен'}
                                     </Typography>
                                   )}
                                   <Chip
                                      label={`Оценка: ${submission.score || 0}/${submission.total_possible_score || submission.questions?.length || '-'}`}
                                      color={(submission.score / (submission.total_possible_score || 1)) * 100 > 70 ? 'success' : (submission.score / (submission.total_possible_score || 1)) * 100 > 40 ? 'warning' : 'error'}
                                      size="small"
                                      sx={{ ml: 2, fontWeight: 600 }}
                                   />
                                </Box>
                             }
                             secondary={
                                <Box display="flex" alignItems="center" mt={0.5}>
                                   <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                   <Typography variant="caption" color="textSecondary">
                                      {new Date(submission.submitted_at).toLocaleString()}
                                   </Typography>
                                </Box>
                             }
                          />
                        </SubmissionItem>
                      ))}
                    </List>
                  </Collapse>
                   {testTitles.indexOf(testTitle) < testTitles.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="textSecondary" textAlign="center">
              У вас пока нет пройденных тестов.
            </Typography>
          )}
        </ContentBox>
      </CompletedTestsContainer>
    </>
  );
}

export default StudentCompletedTests; 