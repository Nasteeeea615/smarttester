import React, { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          bgcolor="#f5f7fa"
          p={4}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Произошла ошибка
          </Typography>
          <Typography variant="body1" color="#6b7280" mb={3}>
            Что-то пошло не так. Попробуйте вернуться на главную страницу.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            sx={{
              background: '#4a90e2',
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                background: '#3a80d2',
                boxShadow: '0 6px 20px rgba(0, 229, 255, 0.3)',
              },
            }}
          >
            На главную
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;