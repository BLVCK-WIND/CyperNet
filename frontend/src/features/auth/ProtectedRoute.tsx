import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { customerRouteRedirect } from '@/utils/customerRoute';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  children,
}) => {
  const { isAuthenticated, computerCode } = useAuthStore();
  const location = useLocation();

  if (redirectPath === '/customer/login') {
    const target = customerRouteRedirect(location.search, isAuthenticated, computerCode);
    if (target) return <Navigate to={target} state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
