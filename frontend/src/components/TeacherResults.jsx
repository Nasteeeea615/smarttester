import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';

const API_BASE_URL = 'http://localhost:5000';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  backgroundColor: '#1a237e',
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: '1rem',
  padding: theme.spacing(2),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  marginLeft: 250,
  padding: theme.spacing(4),
  backgroundColor: '#f5f7fa',
  minHeight: '100vh',
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    padding: theme.spacing(2),
  },
}));

const ResultCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const ScoreChip = styled(Chip)(({ theme, score }) => ({
  backgroundColor: score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336',
  color: '#ffffff',
  fontWeight: 'bold',
  padding: theme.spacing(1),
}));

const StatCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}));

const SubmissionDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minWidth: '60%',
    maxWidth: '80%',
    borderRadius: 12,
  },
}));

const TeacherResults = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statistics, setStatistics] = useState({
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0,
    completionRate: 0,
    bestScore: 0,
    worstScore: 0,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchResults();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (results.length > 0) {
      calculateStatistics();
    }
  }, [results]);

  const calculateStatistics = () => {
    const stats = {
      totalTests: 0,
      totalStudents: new Set(),
      totalScore: 0,
      totalSubmissions: 0,
      bestScore: 0,
      worstScore: 100,
    };

    if (!Array.isArray(results)) {
      setStatistics({
        totalTests: 0,
        totalStudents: 0,
        averageScore: 0,
        completionRate: 0,
        bestScore: 0,
        worstScore: 0,
      });
      return;
    }

    results.forEach(result => {
      if (!result) return;
      
      stats.totalStudents.add(result.student_id);
      stats.totalTests++;
      
      if (Array.isArray(result.submissions) && result.submissions.length > 0) {
        result.submissions.forEach(submission => {
          if (!submission || typeof submission.score !== 'number' || typeof submission.total_possible_score !== 'number') return;
          
          const score = (submission.score / submission.total_possible_score) * 100;
          stats.totalScore += score;
          stats.totalSubmissions++;
          stats.bestScore = Math.max(stats.bestScore, score);
          stats.worstScore = Math.min(stats.worstScore, score);
        });
      }
    });

    setStatistics({
      totalTests: stats.totalTests,
      totalStudents: stats.totalStudents.size,
      averageScore: stats.totalSubmissions > 0 ? (stats.totalScore / stats.totalSubmissions).toFixed(1) : 0,
      completionRate: stats.totalStudents.size > 0 ? ((stats.totalSubmissions / (stats.totalTests * stats.totalStudents.size)) * 100).toFixed(1) : 0,
      bestScore: stats.bestScore.toFixed(1),
      worstScore: stats.worstScore.toFixed(1),
    });
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch(`${API_BASE_URL}/api/classes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Необходима повторная авторизация');
        }
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Неверный формат данных от сервера');
      }

      setClasses(data);
      if (data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (err) {
      console.error('Ошибка при загрузке классов:', err);
      setError(err.message);
      toast.error(`Ошибка при загрузке классов: ${err.message}`);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch(`${API_BASE_URL}/api/results/class/${selectedClass}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Необходима повторная авторизация');
        } else if (response.status === 404) {
          setResults([]);
          return;
        }
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Неверный формат данных от сервера');
      }

      setResults(data);
    } catch (err) {
      console.error('Ошибка при загрузке результатов:', err);
      setError(err.message);
      toast.error(`Ошибка при загрузке результатов: ${err.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (result) => {
    setSelectedSubmission(result);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubmission(null);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString;
    }
  };

  const renderResultsTable = () => {
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    return (
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Ученик</StyledTableCell>
              <StyledTableCell>Тест</StyledTableCell>
              <StyledTableCell>Попыток</StyledTableCell>
              <StyledTableCell>Лучший результат</StyledTableCell>
              <StyledTableCell>Последняя попытка</StyledTableCell>
              <StyledTableCell>Действия</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result) => {
              if (!result || typeof result !== 'object') return null;

              const submissions = Array.isArray(result.submissions) ? result.submissions : [];
              const bestScore = submissions.length > 0 
                ? Math.max(...submissions.map(s => Number(s?.score) || 0))
                : 0;
              const totalPossibleScore = Number(submissions[0]?.total_possible_score) || 1;
              const scorePercentage = (bestScore / totalPossibleScore) * 100;

              return (
                <TableRow key={`${result.student_id || ''}-${result.test_id || ''}`}>
                  <TableCell>{result.student_name || '-'}</TableCell>
                  <TableCell>{result.test_title || '-'}</TableCell>
                  <TableCell>{submissions.length}</TableCell>
                  <TableCell>
                    <ScoreChip
                      label={`${bestScore}/${totalPossibleScore}`}
                      score={scorePercentage}
                    />
                  </TableCell>
                  <TableCell>
                    {submissions.length > 0 && submissions[0]?.submitted_at
                      ? formatDate(submissions[0].submitted_at)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(result)}
                    >
                      Детали
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSubmissionDetails = () => {
    if (!selectedSubmission || !Array.isArray(selectedSubmission.submissions)) {
      return null;
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Попытка</StyledTableCell>
              <StyledTableCell>Дата</StyledTableCell>
              <StyledTableCell>Результат</StyledTableCell>
              <StyledTableCell>Процент</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedSubmission.submissions.map((submission, index) => {
              if (!submission || typeof submission !== 'object') return null;

              const score = Number(submission.score) || 0;
              const totalPossibleScore = Number(submission.total_possible_score) || 1;
              const scorePercentage = (score / totalPossibleScore) * 100;

              return (
                <TableRow key={submission.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                  <TableCell>
                    <ScoreChip
                      label={`${score}/${totalPossibleScore}`}
                      score={scorePercentage}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={scorePercentage}
                        sx={{
                          width: '100%',
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: scorePercentage >= 80 ? '#4caf50' : scorePercentage >= 60 ? '#ff9800' : '#f44336',
                          },
                        }}
                      />
                      <Typography variant="body2" color="textSecondary">
                        {scorePercentage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading && classes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar role="teacher" />
      <MainContent>
        <Typography variant="h4" gutterBottom sx={{ 
          color: '#1a237e', 
          fontWeight: 'bold',
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <EmojiEventsIcon sx={{ fontSize: 32 }} />
          Результаты учеников
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Класс</InputLabel>
              <Select
                value={selectedClass}
                label="Класс"
                onChange={(e) => setSelectedClass(e.target.value)}
                sx={{
                  backgroundColor: '#ffffff',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#1a237e',
                  },
                }}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && classes.length === 0 && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Нет доступных классов
          </Alert>
        )}

        {!loading && Array.isArray(results) && results.length === 0 && selectedClass && !error && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            В выбранном классе пока нет результатов тестирования
          </Alert>
        )}

        {!loading && Array.isArray(results) && results.length > 0 && (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <StatCard>
                  <Box display="flex" alignItems="center" gap={2}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" color="textSecondary">
                        Учеников в классе
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {statistics.totalStudents}
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard>
                  <Box display="flex" alignItems="center" gap={2}>
                    <BarChartIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" color="textSecondary">
                        Средний балл
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {statistics.averageScore}%
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard>
                  <Box display="flex" alignItems="center" gap={2}>
                    <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" color="textSecondary">
                        Процент выполнения
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {statistics.completionRate}%
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>
            </Grid>

            {renderResultsTable()}
          </>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedSubmission && (
            <>
              <DialogTitle>
                <Typography variant="h5" component="div">
                  Результаты {selectedSubmission.student_name || 'Ученика'}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {selectedSubmission.test_title || 'Тест'}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                {renderSubmissionDetails()}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                  Закрыть
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </MainContent>
    </Box>
  );
};

export default TeacherResults; 