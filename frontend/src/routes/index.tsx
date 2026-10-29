import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CustomerLoginPage } from '@/features/customer/pages/CustomerLoginPage';
import { CustomerDashboardPage } from '@/features/customer/pages/CustomerDashboardPage';
import { CustomerMenuPage } from '@/features/customer/pages/CustomerMenuPage';
import { CustomerOrderHistoryPage } from '@/features/customer/pages/CustomerOrderHistoryPage';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { StaffLayout } from '@/components/layout/StaffLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { ZoneManagerPage } from '@/features/admin/pages/ZoneManagerPage';
import { ManageComputersPage } from '@/features/admin/pages/ManageComputersPage';
import { ManageItemsPage } from '@/features/admin/pages/ManageItemsPage';
import { ManageAccountsPage } from '@/features/admin/pages/ManageAccountsPage';
import { RevenueReportsPage } from '@/features/admin/pages/RevenueReportsPage';
import { ComputerUsageReportPage } from '@/features/admin/pages/ComputerUsageReportPage';
import { StaffLoginPage } from '@/features/staff/pages/StaffLoginPage';
import { StaffDashboardPage } from '@/features/staff/pages/StaffDashboardPage';
import { FloorMapPage } from '@/features/staff/pages/FloorMapPage';
import { StaffOrderQueuePage } from '@/features/staff/pages/StaffOrderQueuePage';
import { SellTimePage } from '@/features/staff/pages/SellTimePage';
import { SessionManagerPage } from '@/features/staff/pages/SessionManagerPage';
import { AccountManagerPage } from '@/features/staff/pages/AccountManagerPage';
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
            element: <Navigate to="/staff/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <StaffDashboardPage />,
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
          {
            path: 'accounts',
            element: <AccountManagerPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute redirectPath="/staff/login" />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: (
          <RoleGuard allowedRoles={['ADMIN']}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          {
            path: '',
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'computers',
            element: <ManageComputersPage />,
          },
          {
            path: 'zones',
            element: <ZoneManagerPage />,
          },
          {
            path: 'items',
            element: <ManageItemsPage />,
          },
          {
            path: 'accounts',
            element: <ManageAccountsPage />,
          },
          {
            path: 'reports',
            element: <Navigate to="/admin/reports/revenue" replace />,
          },
          {
            path: 'reports/revenue',
            element: <RevenueReportsPage />,
          },
          {
            path: 'reports/computers',
            element: <ComputerUsageReportPage />,
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
