import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Компонент для перехвата и обработки ошибок в приложении
 * Предотвращает падение всего приложения при ошибке в компоненте
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  /**
   * Обновляет состояние компонента при возникновении ошибки
   * @param {Error} error - Объект ошибки
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Метод жизненного цикла, вызываемый при ошибке
   * @param {Error} error - Объект ошибки
   * @param {Object} errorInfo - Информация об ошибке
   */
  componentDidCatch(error, errorInfo) {
    // Логирование ошибки
    console.error('Ошибка в компоненте:', error);
    console.error('Информация об ошибке:', errorInfo);
    
    // Сохраняем информацию об ошибке для отображения
    this.setState({ errorInfo });
    
    // Здесь можно добавить отправку ошибки в систему мониторинга
  }

  /**
   * Сбрасывает состояние ошибки
   */
  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="h4" color="error" gutterBottom>
              Произошла ошибка
            </Typography>
            
            <Typography variant="body1" color="#6b7280" mb={3}>
              Что-то пошло не так в этом компоненте. Вы можете попробовать:
            </Typography>
            
            <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={this.resetError}
                sx={{
                  background: '#4a90e2',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  '&:hover': {
                    background: '#3a80d2',
                  },
                }}
              >
                Повторить
              </Button>
              
              <Button
                variant="outlined"
                component={Link}
                to="/"
                sx={{
                  color: '#4a90e2',
                  borderColor: '#4a90e2',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#3a80d2',
                    background: 'rgba(74, 144, 226, 0.04)',
                  },
                }}
              >
                На главную
              </Button>
            </Box>
            
            {/* Отображаем техническую информацию в режиме разработки */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box mt={4} textAlign="left" bgcolor="#f8f8f8" p={2} borderRadius={1}>
                <Typography variant="subtitle2" color="error" fontWeight={600}>
                  Ошибка: {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" component="pre" sx={{ mt: 1, overflow: 'auto', maxHeight: 200 }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;