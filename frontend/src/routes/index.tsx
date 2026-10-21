import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CustomerLoginPage } from '@/features/customer/pages/CustomerLoginPage';
import { CustomerDashboardPage } from '@/features/customer/pages/CustomerDashboardPage';
import { CustomerMenuPage } from '@/features/customer/pages/CustomerMenuPage';
import { CustomerOrderHistoryPage } from '@/features/customer/pages/CustomerOrderHistoryPage';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleGuard } from '@/features/auth/RoleGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorBoundary />,
    element: <Navigate to="/customer/login" replace />,
  },
  {
    path: '/customer/login',
    errorElement: <ErrorBoundary />,
    element: <CustomerLoginPage />,
  },
  {
    path: '/customer',
    element: <ProtectedRoute redirectPath="/customer/login" />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: '',
            element: <Navigate to="/customer/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <CustomerDashboardPage />,
          },
          {
            path: 'menu',
            element: <CustomerMenuPage />,
          },
          {
            path: 'orders',
            element: <CustomerOrderHistoryPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
