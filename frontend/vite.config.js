/**
 * Конфигурация Vite для проекта SmartTester
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Плагины
  plugins: [react()],
  
  // Настройки сервера разработки
  server: {
    port: 5173,
    // Проксирование API запросов на бэкенд
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    // Автоматическое открытие браузера при запуске
    open: true,
  },
  
  // Настройки разрешения зависимостей
  resolve: {
    dedupe: ['@emotion/react', '@emotion/styled'],
    alias: {
      // Удобные псевдонимы для импортов
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@assets': '/src/assets',
      '@styles': '/src/styles',
    },
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
  
  // Настройки сборки
  build: {
    // Улучшение процесса сборки
    sourcemap: true,
    minify: 'terser',
    // Настройки для оптимизации конечного бандла
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
});