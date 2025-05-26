import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherCreateTest from './components/TeacherCreateTest';
import TeacherViewTest from './components/TeacherViewTest';
import RegisterTeacher from './components/RegisterTeacher';
import RegisterStudent from './components/RegisterStudent';
import RegisterParent from './components/RegisterParent';
import StudentDashboard from './components/StudentDashboard';
import StudentTest from './components/StudentTest'; // Убедись, что этот компонент существует
import StudentResults from './components/StudentResults';
import ParentDashboard from './components/ParentDashboard';
import { jwtDecode } from 'jwt-decode';
import './App.css';

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  let userRole = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch (err) {
      localStorage.removeItem('token');
      return <Navigate to="/login" />;
    }
  } else {
    return <Navigate to="/login" />;
  }

  if (!userRole) return <Navigate to="/login" />;
  if (allowedRole && userRole !== allowedRole) return <Navigate to="/" />;

  return children;
}

function NotFound() {
  return (
    <div className="container text-center mt-4">
      <h1>404 - Страница не найдена</h1>
      <p className="text-secondary">Проверьте URL или вернитесь на главную страницу.</p>
    </div>
  );
}

function App() {
  try {
    return (
      <Router>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-teacher" element={<RegisterTeacher />} />
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
                path="/teacher/register-student"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <RegisterStudent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/register-parent"
                element={
                  <ProtectedRoute allowedRole="teacher">
                    <RegisterParent />
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
                path="/student/results"
                element={
                  <ProtectedRoute allowedRole="student">
                    <StudentResults />
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
          </main>
          <ToastContainer 
            position="top-right" 
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    );
  } catch (err) {
    console.error('App: Ошибка при рендеринге:', err);
    return (
      <div className="container text-center mt-4">
        <h1 className="text-error">Ошибка приложения</h1>
        <p className="text-secondary">{err.message}</p>
      </div>
    );
  }
}

export default App;