import React from 'react';
import { MotionConfig } from 'framer-motion';
import { ConfigProvider, App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { cyberLuxTheme } from './styles/antd-theme';
import { router } from './routes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GlobalProgressBar } from './components/common/GlobalProgressBar';
import { AuthExpiryFeedback } from './features/auth/AuthExpiryFeedback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user"><ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={cyberLuxTheme}>
          <AntdApp>
            <AuthExpiryFeedback />
            <GlobalProgressBar />
            <RouterProvider router={router} />
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary></MotionConfig>
  );
};

export default App;
