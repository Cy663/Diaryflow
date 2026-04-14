import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from 'shared/types/user';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
