import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

const DashboardContainer = styled(Box)(({ theme, $isSidebarOpen }) => ({
  minHeight: '100vh',
  background: '#f5f7fa',
  marginLeft: $isSidebarOpen ? 250 : 0,
  padding: theme.spacing(4),
  transition: 'margin-left 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    marginLeft: $isSidebarOpen ? 200 : 0,
    padding: theme.spacing(2),
  },
}));

const ContentBox = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '15px',
  padding: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

function ParentDashboard() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch('/api/results/parent', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Ошибка при загрузке результатов:', err);
        setError('Не удалось загрузить результаты. Пожалуйста, попробуйте позже.');
      }
    };

    fetchResults();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <>
      <Sidebar role="parent" isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <DashboardContainer $isSidebarOpen={isSidebarOpen}>
        <ContentBox>
          <Typography variant="h5" fontWeight={700} mb={3} color="#1a2a44">
            Результаты детей
          </Typography>
          {error ? (
            <Typography color="error">{error}</Typography>
          ) : results.length === 0 ? (
            <Typography color="#1a2a44">Нет результатов</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#1a2a44' }}>Ребёнок</TableCell>
                  <TableCell sx={{ color: '#1a2a44' }}>Тест</TableCell>
                  <TableCell sx={{ color: '#1a2a44' }}>Результат</TableCell>
                  <TableCell sx={{ color: '#1a2a44' }}>Дата</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' } }}>
                    <TableCell sx={{ color: '#1a2a44' }}>{result.student_name}</TableCell>
                    <TableCell sx={{ color: '#1a2a44' }}>{result.title}</TableCell>
                    <TableCell sx={{ color: '#1a2a44' }}>{`${result.score}/${result.total_possible_score}`}</TableCell>
                    <TableCell sx={{ color: '#1a2a44' }}>{new Date(result.submitted_at).toLocaleDateString()}</TableCell>
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

export default ParentDashboard;