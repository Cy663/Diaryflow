import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default RoleRedirect;
