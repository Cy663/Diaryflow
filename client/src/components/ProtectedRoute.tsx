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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-amber-600"></div>
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
