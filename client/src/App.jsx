import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import './index.css';

// ProtectedRoute — checks sessionStorage for logged-in user
// and redirects to login if not authenticated or wrong role.
function ProtectedRoute({ children, requiredRole }) {
  const raw = sessionStorage.getItem('loggedInUser');
  if (!raw) return <Navigate to="/" replace />;
  const user = JSON.parse(raw);
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty"
          element={
            <ProtectedRoute requiredRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        {/* Redirect any unknown path back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
