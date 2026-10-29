import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Progress, App } from 'antd';
import {
  Monitor,
  ReceiptText,
  Clock,
  UserPlus,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Sparkles,
  ChevronRight,
  Flame,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PageTransition } from '@/components/animations/PageTransition';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { orderApi } from '@/api/orderApi';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';
import { reportApi } from '@/api/reportApi';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import type { FloorMapComputerItem } from '@/types/computer';

// Quick POS Modals
import { StartSessionModal } from '../components/StartSessionModal';
import { SellTimeModal } from '../components/SellTimeModal';
import { RegisterCustomerModal } from '../components/RegisterCustomerModal';
import type { SessionResponse } from '@/types/auth';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { message } = App.useApp();
  useDocumentTitle('Tổng quan ca trực • CyberNet POS');

  // Modal States
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [sellTimeOpen, setSellTimeOpen] = useState(false);
  const [registerCustomerOpen, setRegisterCustomerOpen] = useState(false);

  const todayStr = dayjs().format('YYYY-MM-DD');

  // 1. Fetch Đơn hàng đang chờ duyệt (Pending Orders - Khẩn cấp)
  const {
    data: pendingOrdersData,
    isFetching: isFetchingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['staff-dashboard-pending-orders'],
    queryFn: () => orderApi.getOrders({ status: 'PENDING_PAYMENT', page: 0, size: 6 }),
    refetchInterval: 5000,
  });

  const pendingCount = pendingOrdersData?.totalElements || 0;

  // 2. Fetch Phiên chơi đang hoạt động trực tiếp (Active Sessions)
  const {
    data: activeSessionsData,
    isFetching: isFetchingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['staff-dashboard-active-sessions'],
    queryFn: () => sessionApi.getSessions({ status: 'ACTIVE', page: 0, size: 10 }),
    refetchInterval: 10000,
  });

  const activeSessions: SessionResponse[] = activeSessionsData?.content || [];
  const activeCount = activeSessionsData?.totalElements || 0;

  // 3. Fetch Toàn bộ máy trạm để lấy tỷ lệ Online
  const { data: computersData } = useQuery({
    queryKey: ['staff-dashboard-computers'],
    queryFn: () => computerApi.getComputers({ size: 100 }),
    refetchInterval: 15000,
  });

  const allComputers = computersData?.content || [];
  const totalComputers = allComputers.length || 0;

  const availableComputers = useMemo(() => {
    return allComputers
      .filter((c) => c.status === 'AVAILABLE')
      .map((c) => ({
        ...c,
        activeSession: null,
      })) as FloorMapComputerItem[];
  }, [allComputers]);

  // 4. Fetch Doanh thu ca trực hôm nay
  const { data: todaySummary } = useQuery({
    queryKey: ['staff-dashboard-today-revenue', todayStr],
    queryFn: () => reportApi.getRevenueSummary({ fromDate: todayStr, toDate: todayStr }),
    refetchInterval: 15000,
  });

  // Tìm các máy sắp hết giờ (< 15 phút)
  const expiringSessions = useMemo(() => {
    return activeSessions.filter((s) => {
      const remaining = s.remainingMinutesUntilExpiry;
      return remaining !== undefined && remaining <= 15 && remaining > 0;
    });
  }, [activeSessions]);

  const handleRefetchAll = () => {
    refetchOrders();
    refetchSessions();
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Shift Header Bar */}
        <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 twinkle-hero-flow shadow-2xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-[11px] font-semibold text-sand shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                <span>TRUNG TÂM VẬN HÀNH CA TRỰC • QUẦY POS THỜI GIAN THỰC</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-sand">
                Xin chào, <span className="text-gold-light">{user?.name || 'Nhân viên thu ngân'}</span>!
              </h1>
              <p className="text-xs sm:text-sm text-sand/80 max-w-2xl font-normal">
                Ca trực đang mở. Theo dõi hàng đợi đơn hàng, tình trạng phòng máy và hỗ trợ khách hàng nhanh chóng.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                icon={<RefreshCw className={`w-4 h-4 ${(isFetchingOrders || isFetchingSessions) ? 'animate-spin' : ''}`} />}
                onClick={handleRefetchAll}
                className="rounded-xl h-10 border-mist/30 text-sand hover:border-gold hover:text-gold bg-midnight/60"
              >
                Làm Mới
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/staff/floormap')}
                className="h-10 px-4 rounded-xl bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                <span>Xem Sơ Đồ Máy</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Dải chỉ số ca trực 3D (Shift Telemetry 4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Đơn chờ duyệt */}
          <div
            onClick={() => navigate('/staff/orders')}
            className={`liquid-glass-card liquid-glass-sunset cursor-pointer hover:scale-[1.02] transition-transform ${
              pendingCount > 0 ? 'ring-2 ring-red-500/50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Đơn Chờ Duyệt</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2 flex items-center gap-2">
              <span>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                  Khẩn
                </span>
              )}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Hàng đợi đơn</span>
              <span className="font-bold text-gold flex items-center gap-0.5">
                Xem ngay <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Máy đang hoạt động */}
          <div
            onClick={() => navigate('/staff/floormap')}
            className="liquid-glass-card liquid-glass-cyan cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Máy Đang Hoạt Động</span>
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                <Monitor className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {activeCount} <span className="text-sm font-normal text-sand/70">/ {totalComputers}</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Tỷ lệ lấp đầy</span>
              <span className="font-bold text-cyan-300">
                {totalComputers > 0 ? `${Math.round((activeCount / totalComputers) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Sắp hết giờ */}
          <div
            onClick={() => navigate('/staff/sessions')}
            className="liquid-glass-card liquid-glass-amber cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Sắp Hết Giờ (&lt;15p)</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {expiringSessions.length}
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Cần nhắc khách</span>
              <span className="font-bold text-amber-300">Gia hạn</span>
            </div>
          </div>

          {/* Doanh thu hôm nay */}
          <div className="liquid-glass-card liquid-glass-emerald cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sand/80">Doanh Thu Hôm Nay</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-heading font-bold text-sand mt-2">
              {Number(todaySummary?.totalRevenue || 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-sand/70">₫</span>
            </div>
            <div className="frosted-glass-pill mt-3 flex items-center justify-between text-xs">
              <span>Tiền mặt & VietQR</span>
              <span className="font-bold text-emerald-400">{(todaySummary?.totalOrders || 0) + (todaySummary?.totalTimePurchases || 0)} gd</span>
            </div>
          </div>
        </div>

        {/* 3. SHADCN BENTO GRID: PHIÊN HOẠT ĐỘNG TRỰC TIẾP & BÀN ĐIỀU KHIỂN NHANH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cột lớn (2/3 width): Danh Sách Phiên Đang Chạy Kèm Đếm Ngược */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-mist/15 pb-3">
              <div>
                <h2 className="text-base font-heading font-bold text-sand flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  Phiên Chơi Đang Hoạt Động Trực Tiếp
                </h2>
                <p className="text-xs text-mist">
                  Theo dõi thời gian chơi thực tế của khách hàng tại các máy trạm
                </p>
              </div>

              <Button
                type="link"
                size="small"
                onClick={() => navigate('/staff/sessions')}
                className="text-gold text-xs flex items-center gap-1 p-0 hover:text-gold-light"
              >
                <span>Tất cả phiên</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {activeSessions.length === 0 ? (
              <div className="py-12 text-center text-xs text-mist space-y-2">
                <Monitor className="w-8 h-8 mx-auto opacity-30" />
                <p>Hiện không có máy trạm nào đang mở phiên</p>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => setStartSessionOpen(true)}
                  className="rounded-lg bg-gold text-midnight font-bold border-0 text-xs"
                >
                  Mở Máy Ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSessions.slice(0, 5).map((session) => {
                  const remaining = session.remainingMinutesUntilExpiry ?? 0;
                  const isLowTime = remaining <= 15;
                  const totalPlayed = session.playedMinutes || 0;
                  const totalEst = totalPlayed + remaining;
                  const progressPct = totalEst > 0 ? Math.min(100, Math.round((totalPlayed / totalEst) * 100)) : 0;

                  return (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-xl bg-black/25 border border-white/5 hover:border-gold/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-heading font-bold text-sm shrink-0">
                            {session.computerCode}
                          </div>
                          <div>
                            <div className="font-semibold text-sand flex items-center gap-1.5">
                              <span>{session.accountName}</span>
                              <ZoneBadge zone={session.computerZone} size="sm" />
                            </div>
                            <div className="text-[11px] text-mist font-mono mt-0.5">
                              {session.accountPhone}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-heading font-bold text-sm ${
                              isLowTime ? 'text-red-400 animate-pulse' : 'text-gold'
                            }`}
                          >
                            {remaining} phút còn lại
                          </div>
                          <div className="text-[11px] text-mist/70 font-mono">
                            Đã chơi: {totalPlayed}p
                          </div>
                        </div>
                      </div>

                      {/* Mini Progress */}
                      <Progress
                        percent={progressPct}
                        showInfo={false}
                        strokeColor={isLowTime ? '#ef4444' : '#bd9875'}
                        trailColor="rgba(255,255,255,0.06)"
                        size="small"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột nhỏ (1/3 width): Bàn Điều Khiển Nhanh 1-Click (Quick Action Dock) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Zap className="w-4 h-4" />
                <span>Thao Tác Quầy POS</span>
              </div>
              <h2 className="text-base font-heading font-bold text-sand mt-0.5">
                Bàn Điều Khiển Nhanh
              </h2>
              <p className="text-xs text-mist">
                Phím tắt thao tác phục vụ khách 1-chạm tại quầy
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setStartSessionOpen(true)}
                className="w-full p-3.5 rounded-xl bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/40 hover:border-gold hover:bg-gold/25 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold text-midnight flex items-center justify-center font-bold shrink-0">
                    <PlayCircle className="w-5 h-5 text-midnight" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-sand group-hover:text-gold transition-colors">
                      Mở Máy Mới Cho Khách
                    </div>
                    <div className="text-[11px] text-mist">
                      Mở phiên theo số dư tài khoản
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gold shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setSellTimeOpen(true)}
                className="w-full p-3.5 rounded-xl bg-black/25 border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-sand group-hover:text-emerald-400 transition-colors">
                      Bán Giờ Chơi Tại Quầy
                    </div>
                    <div className="text-[11px] text-mist">
                      Nạp thêm phút (CASH / VietQR)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setRegisterCustomerOpen(true)}
                className="w-full p-3.5 rounded-xl bg-black/25 border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-sand group-hover:text-cyan-400 transition-colors">
                      Đăng Ký Hội Viên Mới
                    </div>
                    <div className="text-[11px] text-mist">
                      Mở tài khoản kèm nạp đầu 10k
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-2 border-t border-mist/15 text-[11px] text-mist/70 text-center">
              Mọi thao tác thu ngân được ghi nhận kiểm toán tự động
            </div>
          </div>
        </div>

        {/* 4. MODALS QUẦY POS */}
        <StartSessionModal
          open={startSessionOpen}
          computer={null}
          availableComputers={availableComputers}
          onClose={() => setStartSessionOpen(false)}
          onSuccess={() => {
            message.success('Mở máy cho khách thành công!');
            handleRefetchAll();
          }}
        />

        <SellTimeModal
          open={sellTimeOpen}
          onClose={() => setSellTimeOpen(false)}
          onSuccess={() => {
            message.success('Giao dịch nạp giờ thành công!');
            handleRefetchAll();
          }}
        />

        <RegisterCustomerModal
          open={registerCustomerOpen}
          onCancel={() => setRegisterCustomerOpen(false)}
          onSuccess={() => {
            message.success('Đăng ký hội viên thành công!');
            setRegisterCustomerOpen(false);
            handleRefetchAll();
          }}
        />
      </div>
    </PageTransition>
  );
};

export default StaffDashboardPage;
