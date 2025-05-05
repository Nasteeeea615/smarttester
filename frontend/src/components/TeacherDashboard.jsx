import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/system';
import { toast } from 'react-toastify';
import { MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
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

function TeacherDashboard() {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Токен из localStorage:', token); // Отладка

    if (!token) {
      setError('Токен отсутствует. Пожалуйста, войдите заново.');
      navigate('/login');
      return;
    }

    fetch('/api/tests/teacher', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(`Ошибка загрузки тестов: ${res.status} ${res.statusText} - ${data.message || ''}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        console.log('Полученные тесты:', data);
        setTests(data);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке тестов:', err);
        setError('Не удалось загрузить тесты: ' + err.message);
      });
  }, [navigate]);

  const handleViewTest = (testId) => {
    navigate(`/teacher/view/${testId}`);
  };

  const handleEditTest = (testId) => {
    navigate(`/teacher/edit/${testId}`);
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Ошибка удаления теста: ${response.status} ${response.statusText}`);
      }

      setTests(tests.filter((test) => test.id !== testId));
      toast.success('Тест успешно удалён!');
    } catch (err) {
      console.error('Ошибка при удалении теста:', err);
      setError('Не удалось удалить тест: ' + err.message);
    }
  };

  return (
    <>
      <Sidebar role="teacher" />
      <DashboardContainer>
        <ContentBox>
          <Box mb={3}>
            <Typography variant="h5" fontWeight={700}>
              Мои тесты
            </Typography>
          </Box>
          {error && (
            <Typography color="error" mb={2}>
              {error}
            </Typography>
          )}
          {tests.length === 0 ? (
            <Typography>У вас пока нет тестов</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Класс</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.title}</TableCell>
                    <TableCell>{test.class_name}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewTest(test.id)}
                        sx={{ color: '#1a237e', mr: 1 }}
                      >
                        <MdVisibility />
                      </Button>
                      <Button
                        onClick={() => handleEditTest(test.id)}
                        sx={{ color: '#1a237e', mr: 1 }}
                      >
                        <MdEdit />
                      </Button>
                      <Button
                        onClick={() => handleDeleteTest(test.id)}
                        sx={{ color: '#ff4444' }}
                      >
                        <MdDelete />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ContentBox>
      </DashboardContainer>
    </>
  );
}

export default TeacherDashboard;