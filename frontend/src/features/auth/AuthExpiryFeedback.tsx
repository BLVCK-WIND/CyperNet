import { useLayoutEffect } from 'react';
import { App } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

export function AuthExpiryFeedback() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    const handleExpiry = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== 'AUTH_ROLE_CHANGED') return;

      queryClient.clear();
      void message.warning({
        key: 'auth-role-changed',
        content: 'Quyền của tài khoản đã thay đổi. Vui lòng đăng nhập lại.',
        duration: 6,
      });
    };

    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, [message, queryClient]);

  return null;
}
