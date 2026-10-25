import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CustomerLoginPage } from '@/features/customer/pages/CustomerLoginPage';
import { CustomerDashboardPage } from '@/features/customer/pages/CustomerDashboardPage';
import { CustomerMenuPage } from '@/features/customer/pages/CustomerMenuPage';
import { CustomerOrderHistoryPage } from '@/features/customer/pages/CustomerOrderHistoryPage';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { StaffLoginPage } from '@/features/staff/pages/StaffLoginPage';
import { FloorMapPage } from '@/features/staff/pages/FloorMapPage';
import { StaffOrderQueuePage } from '@/features/staff/pages/StaffOrderQueuePage';
import { SellTimePage } from '@/features/staff/pages/SellTimePage';
import { SessionManagerPage } from '@/features/staff/pages/SessionManagerPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorBoundary } from '@/components/common/ErrorBoundary';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleGuard } from '@/features/auth/RoleGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorBoundary />,
    element: <Navigate to="/customer/login" replace />,
  },
  {
    path: '/customer/login',
    errorElement: <RouteErrorBoundary />,
    element: <CustomerLoginPage />,
  },
  {
    path: '/customer',
    element: <ProtectedRoute redirectPath="/customer/login" />,
    errorElement: <RouteErrorBoundary />,
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
    path: '/staff/login',
    errorElement: <RouteErrorBoundary />,
    element: <StaffLoginPage />,
  },
  {
    path: '/staff',
    element: <ProtectedRoute redirectPath="/staff/login" />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: '',
            element: <Navigate to="/staff/floormap" replace />,
          },
          {
            path: 'floormap',
            element: <FloorMapPage />,
          },
          {
            path: 'orders',
            element: <StaffOrderQueuePage />,
          },
          {
            path: 'sell-time',
            element: <SellTimePage />,
          },
          {
            path: 'sessions',
            element: <SessionManagerPage />,
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
