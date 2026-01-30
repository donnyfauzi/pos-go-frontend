import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { ReactNode } from 'react';

type AppRole = 'admin' | 'kasir' | 'koki';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  // Jika belum login, redirect ke login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Jika ada allowedRoles, check role user
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role as AppRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  // Semua check passed, render children
  return <>{children}</>;
}
