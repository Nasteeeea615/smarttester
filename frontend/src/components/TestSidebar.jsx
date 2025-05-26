import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';

// Стилизованный контейнер
const TestContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== '$open',
})(({ theme, $open }) => ({
  minHeight: '100vh',
  background: 'var(--background-light)',
  marginLeft: $open ? 250 : 0,
  padding: 'var(--spacing-xl)',
  transition: 'margin-left var(--transition-normal)',
}));

function TestSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    console.log("Test component toggling sidebar, current state:", sidebarOpen);
    setSidebarOpen(prev => !prev);
  };

  // Отладочный эффект
  useEffect(() => {
    console.log("TestSidebar render with state:", sidebarOpen);
  }, [sidebarOpen]);

  return (
    <>
      <Sidebar role="student" open={sidebarOpen} toggleSidebar={toggleSidebar} />
      <TestContainer $open={sidebarOpen}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Тест боковой панели
          </Typography>
          <Typography variant="body1" paragraph>
            Текущее состояние: {sidebarOpen ? 'Открыта' : 'Закрыта'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={toggleSidebar}
          >
            {sidebarOpen ? 'Закрыть панель' : 'Открыть панель'}
          </Button>
        </Paper>
      </TestContainer>
    </>
  );
}

export default TestSidebar; 