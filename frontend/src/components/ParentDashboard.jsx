import { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/system';
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

function ParentDashboard() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/test-results/parent', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <>
      <Sidebar role="parent" />
      <DashboardContainer>
        <ContentBox>
          <Typography variant="h5" fontWeight={700} mb={3} color="#1a2a44">
            Результаты детей
          </Typography>
          {results.length === 0 ? (
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
                  <TableRow key={result.id}>
                    <TableCell sx={{ color: '#1a2a44' }}>{result.student_name}</TableCell>
                    <TableCell sx={{ color: '#1a2a44' }}>{result.title}</TableCell>
                    <TableCell sx={{ color: '#1a2a44' }}>{`${result.score}/${result.total}`}</TableCell>
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