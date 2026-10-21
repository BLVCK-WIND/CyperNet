import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types/auth';

interface RoleGuardProps {
  allowedRoles: Role[];
  fallbackPath?: string;
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  fallbackPath,
  children,
}) => {
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.includes(role);

  if (!hasPermission) {
    // Nếu không khớp quyền, redirect về dashboard tương ứng của role đó
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    switch (role) {
      case 'CUSTOMER':
        return <Navigate to="/customer/dashboard" replace />;
      case 'STAFF':
        return <Navigate to="/staff/dashboard" replace />;
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleGuard;
