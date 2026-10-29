import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton, App } from 'antd';
import {
  LogOut,
  Monitor,
  User as UserIcon,
  Utensils,
  ReceiptText,
  Calendar,
  Clock,
  Sparkles,
  Coffee,
} from 'lucide-react';
import dayjs from 'dayjs';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTransition } from '@/components/animations/PageTransition';
import { Sparkles as SparklesParticles } from '@/components/animations/Sparkles';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import { TimerRing } from '../components/TimerRing';
import { SessionStats } from '../components/SessionStats';
import { useSession } from '../hooks/useSession';
import { useCountdown } from '../hooks/useCountdown';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const CustomerDashboardPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { user, computerCode, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session, isLoading } = useSession({
    computerCode: computerCode || undefined,
  });

  useDocumentTitle(`Máy trạm ${computerCode || session?.computerCode || 'PC'} • Bảng điều khiển`);

  const countdown = useCountdown({
    serverTime: session?.serverTime,
    expiresAt: session?.expiresAt,
    startedAt: session?.startedAt,
    onExpire: () => {
      message.warning('Phiên chơi của bạn đã hết giờ! Vui lòng nạp thêm giờ để tiếp tục.');
    },
  });

  // Dynamic Tariff: Quy đổi số dư theo đơn giá máy trạm đang ngồi
  const baseTariff = 10000;
  const computerPrice = Number(session?.pricePerHour) || baseTariff;
  const rawRemainingMinutes = user?.remainingMinutes ?? session?.accountRemainingMinutes ?? 0;
  const isDifferentTariff = computerPrice !== baseTariff;
  const convertedMinutes = Math.floor((rawRemainingMinutes * baseTariff) / computerPrice);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      message.info('Đã đăng xuất khỏi phiên chơi.');
      navigate(computerCode ? `/customer/login?code=${computerCode}` : '/customer/login', {
        replace: true,
      });
    } catch {
      navigate(computerCode ? `/customer/login?code=${computerCode}` : '/customer/login', {
        replace: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col justify-between selection:bg-gold selection:text-midnight relative overflow-hidden">
        <SparklesParticles count={8} />
        {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 glass-panel border-b border-mist/15 px-4 sm:px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate border border-gold/40 flex items-center justify-center text-gold shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sand block tracking-wide">
                {user?.name || 'Khách hàng'}
              </span>
              <span className="text-[11px] text-mist font-mono">
                {user?.phone || 'Chưa xác định'}
              </span>
            </div>
          </div>

          {/* Machine & Zone Badges + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-midnight/80 border border-mist/20 text-xs font-['Space_Grotesk'] font-bold text-sand">
              <Monitor className="w-3.5 h-3.5 text-gold" />
              <span>{computerCode || session?.computerCode || 'PC'}</span>
            </div>

            <ZoneBadge
              zone={session?.computerZone}
              size="sm"
              className="hidden sm:inline-flex"
            />

            <Button
              type="text"
              danger
              size="small"
              loading={isLoggingOut}
              disabled={isLoggingOut}
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              className="text-xs text-danger hover:bg-danger/10 flex items-center"
            >
              <span className="hidden sm:inline ml-1">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col items-center justify-center space-y-6">
        {isLoading ? (
          <GlassCard className="w-full text-center py-12">
            <Skeleton active paragraph={{ rows: 4 }} />
          </GlassCard>
        ) : !session ? (
          /* MÀN HÌNH CHẾ ĐỘ GỌI MÓN TẠI BÀN KHI MÁY TRỐNG (CHƯA MỞ PHIÊN PC) */
          <div className="w-full space-y-5 animate-fade-in">
            {/* Card chính: Trạng thái máy & Số dư tài khoản */}
            <GlassCard elevated className="w-full p-6 text-center space-y-4 border-gold/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-36 h-36 bg-gold/10 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate/70 border border-gold/30 text-xs font-semibold text-gold">
                <Coffee className="w-3.5 h-3.5 text-gold" />
                <span>CHẾ ĐỘ GỌI MÓN TẠI BÀN</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-sand mb-1">
                  Máy trạm <span className="text-gold">{computerCode || 'PC'}</span>
                </h2>
                <p className="text-xs text-mist">
                  Chưa mở phiên chơi trên PC • Giờ chơi trong tài khoản được bảo lưu 100%
                </p>
              </div>

              {/* Hộp số dư tài khoản an toàn */}
              <div className="p-4 rounded-xl bg-midnight/80 border border-mist/20 max-w-sm mx-auto space-y-1">
                <span className="text-[11px] text-mist uppercase tracking-wider block">
                  Số dư giờ trong tài khoản
                </span>
                <span className="text-3xl font-black font-['Space_Grotesk'] text-gold">
                  {rawRemainingMinutes} <span className="text-sm font-sans font-medium text-sand/80">phút chuẩn</span>
                </span>
                <span className="text-[11px] text-emerald-400 block font-medium">
                  ✓ Chưa tính giờ (không bị trừ phút)
                </span>
              </div>

              {/* Thông báo hướng dẫn mở máy PC */}
              <div className="p-3.5 rounded-xl bg-slate/40 border border-mist/15 text-left text-xs text-sand/85 space-y-1.5 leading-relaxed">
                <div className="font-semibold text-gold flex items-center gap-1.5 text-xs">
                  <Monitor className="w-4 h-4 text-gold shrink-0" />
                  <span>Cách bắt đầu chơi game tại máy này:</span>
                </div>
                <p className="text-[11px] text-mist pl-5.5">
                  Bạn vui lòng gõ <strong>Số điện thoại</strong> và <strong>mật khẩu</strong> trực tiếp trên màn hình máy tính để đăng nhập. Hệ thống sẽ bắt đầu tính giờ từ thời điểm đó.
                </p>
              </div>
            </GlassCard>

            {/* Quick Action Buttons: Gọi món F&B & Xem Đơn hàng */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="primary"
                size="large"
                icon={<Utensils className="w-4 h-4 text-midnight" />}
                onClick={() => navigate('/customer/menu')}
                className="h-13 font-bold text-sm bg-gold hover:bg-gold-light active:bg-gold-dark text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2 transition-all duration-300"
              >
                GỌI MÓN / NẠP GIỜ
              </Button>

              <Button
                size="large"
                icon={<ReceiptText className="w-4 h-4 text-gold" />}
                onClick={() => navigate('/customer/orders')}
                className="h-13 font-semibold text-sm bg-slate/70 hover:bg-slate active:bg-midnight text-sand rounded-xl border border-gold/30 hover:border-gold shadow-md flex items-center justify-center gap-2 transition-all duration-300"
              >
                ĐƠN HÀNG CỦA TÔI
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Countdown Hero Section */}
            <div className="relative py-2 flex flex-col items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gold/5 rounded-full blur-[90px] pointer-events-none" />
              <TimerRing countdown={countdown} size={270} />
            </div>

            {/* Quick Stats Row */}
            <SessionStats
              playedMinutes={session?.playedMinutes ?? 0}
              pricePerHour={session?.pricePerHour ?? 10000}
              computerZone={session?.computerZone ?? 'STANDARD'}
            />

            {/* Quick Action Buttons (Gọi món & Đơn hàng) */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="primary"
                size="large"
                icon={<Utensils className="w-4 h-4 text-midnight" />}
                onClick={() => navigate('/customer/menu')}
                className="h-13 font-bold text-sm bg-gold hover:bg-gold-light active:bg-gold-dark text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2 transition-all duration-300"
              >
                GỌI MÓN F&B
              </Button>

              <Button
                size="large"
                icon={<ReceiptText className="w-4 h-4 text-gold" />}
                onClick={() => navigate('/customer/orders')}
                className="h-13 font-semibold text-sm bg-slate/70 hover:bg-slate active:bg-midnight text-sand rounded-xl border border-gold/30 hover:border-gold shadow-md flex items-center justify-center gap-2 transition-all duration-300"
              >
                ĐƠN HÀNG
              </Button>
            </div>

            {/* Session Detail Card */}
            <GlassCard elevated className="w-full border-mist/15 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-mist/10 pb-2">
                <span className="text-[11px] font-semibold text-sand flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  Chi tiết phiên chơi
                </span>
                <span className="font-mono text-mist">ID: #{session?.id || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between text-mist">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Bắt đầu:
                </span>
                <span className="font-mono text-sand">
                  {session?.startedAt
                    ? dayjs(session.startedAt).format('HH:mm - DD/MM/YYYY')
                    : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between text-mist">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Dự kiến kết thúc:
                </span>
                <span className="font-mono text-sand">
                  {session?.expiresAt
                    ? dayjs(session.expiresAt).format('HH:mm:ss')
                    : 'N/A'}
                </span>
              </div>

              <div className="border-t border-mist/10 pt-2 space-y-1">
                <div className="flex items-center justify-between text-mist">
                  <span>Số dư khả dụng tại máy:</span>
                  <span className="font-mono font-bold text-gold text-sm">
                    {convertedMinutes} phút
                  </span>
                </div>
                {isDifferentTariff && (
                  <div className="flex items-center justify-between text-[11px] text-mist/70">
                    <span>Gốc trong tài khoản:</span>
                    <span className="font-mono text-sand">
                      {rawRemainingMinutes} phút chuẩn (@10k/h)
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        )}
      </main>

        {/* 3. FOOTER (Desktop only) */}
        <footer className="hidden sm:block py-4 text-center text-xs text-mist/60 border-t border-mist/10">
          CyberNet Gaming Lounge • Quản lý phiên chơi thời gian thực
        </footer>
      </div>
    </PageTransition>
  );
};

export default CustomerDashboardPage;
