import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { CustomerBottomNav } from './CustomerBottomNav';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { useSession } from '@/features/customer/hooks/useSession';
import { useCountdown } from '@/features/customer/hooks/useCountdown';
import { useAuthStore } from '@/store/authStore';

export const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const { computerCode, logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualDismissed, setManualDismissed] = useState(false);

  const { data: session, refetch: refetchSession } = useSession({
    computerCode: computerCode || undefined,
  });

  const countdown = useCountdown({
    serverTime: session?.serverTime,
    expiresAt: session?.expiresAt,
    startedAt: session?.startedAt,
    onExpire: () => {
      setManualDismissed(false);
    },
  });

  // Phiên chơi được coi là đã hết hạn nếu countdown kết thúc và có session hoặc session status === 'ENDED'
  const isSessionExpired =
    !manualDismissed &&
    Boolean(session) &&
    (countdown.isExpired || session?.status === 'ENDED');

  const handleLogout = async () => {
    try {
      await logout();
      message.info('Đã đăng xuất khỏi phiên chơi.');
    } finally {
      navigate(computerCode ? `/customer/login?code=${computerCode}` : '/customer/login', {
        replace: true,
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await refetchSession();
      if (res.data && res.data.remainingMinutesUntilExpiry > 0 && res.data.status === 'ACTIVE') {
        setManualDismissed(true);
        message.success('Đã cập nhật phiên chơi! Giờ chơi đã được cộng.');
      } else {
        message.warning('Chưa phát hiện giờ chơi mới. Vui lòng liên hệ quầy thu ngân!');
      }
    } catch {
      message.error('Không thể kiểm tra phiên chơi. Vui lòng thử lại!');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-sand flex flex-col relative">
      <div className="flex-1 pb-16 sm:pb-0">
        <Outlet />
      </div>
      <CustomerBottomNav />

      <SessionExpiredModal
        open={isSessionExpired}
        computerCode={computerCode || session?.computerCode}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
};

export default CustomerLayout;
