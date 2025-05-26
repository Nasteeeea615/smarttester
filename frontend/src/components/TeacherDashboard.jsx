import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import { MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import Sidebar from './Sidebar';

const DashboardContainer = styled(Box)(({ theme, isSidebarOpen }) => ({
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

const ContentBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(1),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

function TeacherDashboard() {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const testsPerPage = 10;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const token = localStorage.getItem('token');

  const fetchTests = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/tests', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка загрузки тестов: ${response.status}`);
      }

      const data = await response.json();
      console.log('Полученные данные:', data);

      if (!data || typeof data !== 'object') {
        throw new Error('Получены некорректные данные: ожидался объект');
      }

      const testsArray = Array.isArray(data.tests) ? data.tests : 
                        Array.isArray(data) ? data : 
                        [];

      if (testsArray.length === 0) {
        console.log('Получен пустой массив тестов');
      }

      setTests(testsArray);
      setError('');
    } catch (err) {
      console.error('Ошибка при загрузке тестов:', err);
      setError(err.message);
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleViewTest = useCallback((testId) => {
    navigate(`/teacher/view/${testId}`);
  }, [navigate]);

  const handleEditTest = useCallback((testId) => {
    navigate(`/teacher/edit/${testId}`);
  }, [navigate]);

  const handleDelete = useCallback(async (testId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при удалении теста');
      }

      toast.success('Тест успешно удалён');
      fetchTests(); // Обновляем список тестов
    } catch (err) {
      console.error('Ошибка при удалении теста:', err);
      toast.error(err.message || 'Не удалось удалить тест');
    }
  }, [token, fetchTests]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const paginatedTests = Array.isArray(tests) ? tests.slice((page - 1) * testsPerPage, page * testsPerPage) : [];

  if (loading) {
    return (
      <>
        <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <DashboardContainer isSidebarOpen={isSidebarOpen}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        </DashboardContainer>
      </>
    );
  }

  return (
    <>
      <Sidebar role="teacher" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <DashboardContainer isSidebarOpen={isSidebarOpen}>
        <ContentBox>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700} color="#1a2a44">
              Мои тесты
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tests.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" py={4}>
              У вас пока нет тестов
            </Typography>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Класс</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTests.map((test) => (
                    <TableRow key={test.id} hover>
                      <TableCell>{test.title}</TableCell>
                      <TableCell>{test.class_name}</TableCell>
                      <TableCell>
                        <ActionButton
                          onClick={() => handleViewTest(test.id)}
                          sx={{ color: '#1a237e' }}
                        >
                          <MdVisibility />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleEditTest(test.id)}
                          sx={{ color: '#1a237e' }}
                        >
                          <MdEdit />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDelete(test.id)}
                          sx={{ color: '#ff4444' }}
                        >
                          <MdDelete />
                        </ActionButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={Math.ceil(tests.length / testsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            </>
          )}
        </ContentBox>
      </DashboardContainer>
    </>
  );
}

export default React.memo(TeacherDashboard);