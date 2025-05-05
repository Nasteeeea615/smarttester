import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherCreateTest from './components/TeacherCreateTest';
import TeacherViewTest from './components/TeacherViewTest';
import StudentDashboard from './components/StudentDashboard';
import StudentTest from './components/StudentTest';
import ParentDashboard from './components/ParentDashboard';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ children, allowedRole }) {
  console.log('ProtectedRoute: Проверка токена и роли...');
  const token = localStorage.getItem('token');
  let userRole = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
      console.log('ProtectedRoute: Роль пользователя:', userRole);
    } catch (err) {
      console.error('ProtectedRoute: Ошибка декодирования токена:', err);
      localStorage.removeItem('token');
      return <Navigate to="/login" />;
    }
  } else {
    console.log('ProtectedRoute: Токен отсутствует, редирект на /login');
    return <Navigate to="/login" />;
  }

  if (!userRole) {
    console.log('ProtectedRoute: Роль не определена, редирект на /login');
    return <Navigate to="/login" />;
  }

  if (allowedRole && userRole !== allowedRole) {
    console.log(`ProtectedRoute: Роль ${userRole} не соответствует ${allowedRole}, редирект на /`);
    return <Navigate to="/" />;
  }

  console.log('ProtectedRoute: Доступ разрешён');
  return children;
}

function NotFound() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>404 - Страница не найдена</h1>
      <p>Проверьте URL или вернитесь на главную страницу.</p>
    </div>
  );
}

function App() {
  console.log('App: Рендеринг приложения...');
  try {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherCreateTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/view/:testId"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherViewTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/edit/:testId"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherCreateTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/test/:testId"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    );
  } catch (err) {
    console.error('App: Ошибка при рендеринге:', err);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Ошибка приложения</h1>
        <p>{err.message}</p>
      </div>
    );
  }
}

export default App;