import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Tooltip, Popover, Button } from 'antd';
import { motion } from 'framer-motion';
import {
  Bell,
  PanelLeft,
  Clock as ClockIcon,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';
import { useAuthStore } from '@/store/authStore';
import { soundAlert } from '@/utils/soundAlert';
import { ZoneBadge } from '@/components/common/ZoneBadge';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface StaffTopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  '/staff/floormap': {
    title: 'Sơ đồ máy trạm (Floor Map)',
    subtitle: 'Theo dõi và quản lý trạng thái máy thời gian thực',
  },
  '/staff/orders': {
    title: 'Hàng đợi đơn hàng (Order Queue)',
    subtitle: 'Tiếp nhận, duyệt và xử lý đơn gọi món F&B',
  },
  '/staff/sell-time': {
    title: 'Bán giờ chơi (Sell Time POS)',
    subtitle: 'Nạp giờ chơi và xuất hóa đơn nhanh tại quầy',
  },
  '/staff/sessions': {
    title: 'Quản lý phiên chơi (Session Manager)',
    subtitle: 'Theo dõi chi tiết phiên hoạt động và lịch sử máy',
  },
};

export const StaffTopBar: React.FC<StaffTopBarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isSoundMuted, setIsSoundMuted] = useState(() => soundAlert.isSoundMuted());
  const prevPendingCountRef = useRef<number | null>(null);

  // Cập nhật đồng hồ hệ thống mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling danh sách 4 đơn PENDING_PAYMENT mới nhất cho Popover và badge mỗi 5 giây
  const { data: pendingOrdersData } = useQuery({
    queryKey: ['staff-topbar-pending-orders'],
    queryFn: () => orderApi.getOrders({ status: 'PENDING_PAYMENT', page: 0, size: 4 }),
    enabled: Boolean(isAuthenticated && (role === 'STAFF' || role === 'ADMIN')),
    refetchInterval: 5000,
  });

  // Polling số máy online / tổng máy (Dùng key riêng 'staff-quick-status-stats', không xung đột với useFloorMap)
  const { data: quickStats } = useQuery({
    queryKey: ['staff-quick-status-stats'],
    queryFn: async () => {
      const [computersRes, sessionsRes] = await Promise.all([
        computerApi.getComputers({ size: 100 }),
        sessionApi.getSessions({ status: 'ACTIVE', size: 100 }),
      ]);
      const computers = computersRes.content || [];
      const inUseCount = computers.filter((c) => c.status === 'IN_USE').length;
      return {
        totalComputers: computersRes.totalElements || computers.length || 0,
        activeSessionsCount: inUseCount || sessionsRes.totalElements || sessionsRes.content?.length || 0,
      };
    },
    enabled: Boolean(isAuthenticated && (role === 'STAFF' || role === 'ADMIN')),
    refetchInterval: 10000,
  });

  const pendingCount = pendingOrdersData?.totalElements || 0;
  const recentOrders = pendingOrdersData?.content || [];

  // Phát âm thanh chime khi có đơn mới xuất hiện
  useEffect(() => {
    if (prevPendingCountRef.current !== null && pendingCount > prevPendingCountRef.current) {
      soundAlert.playNewOrderChime();
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount]);

  const handleToggleSound = () => {
    const nextState = !isSoundMuted;
    soundAlert.setMuted(nextState);
    setIsSoundMuted(nextState);
  };

  const currentRouteInfo = routeTitleMap[location.pathname] || {
    title: 'Bàn làm việc nhân viên',
    subtitle: 'Hệ thống quản lý phòng máy CyberNet',
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-midnight/90 backdrop-blur-md border-b border-mist/15">
      {/* 1. Left: Nút Toggle & Breadcrumb Tiêu đề */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-mist hover:text-gold hover:bg-gold/15 transition-colors cursor-pointer"
          aria-label={collapsed ? 'Mở menu' : 'Đóng menu'}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-mist">
            <span className="inline-flex items-center gap-1 text-sand font-medium">
              <Layers className="w-3.5 h-3.5 text-gold" />
              Staff
            </span>
            <span className="text-mist/40">/</span>
            <span className="text-gold font-medium">{currentRouteInfo.title}</span>
          </div>
          <span className="text-xs text-mist/80 hidden sm:inline">
            {currentRouteInfo.subtitle}
          </span>
        </div>
      </div>

      {/* 2. Right: Trạng thái ca trực, Đồng hồ & Chuông thông báo */}
      <div className="flex items-center gap-4">
        {/* Ca trực Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate/50 border border-mist/20 text-xs text-sand">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="font-medium text-[11px] tracking-wide">CA TRỰC QUẦY</span>
        </div>

        {/* Đồng hồ hệ thống */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-midnight border border-mist/15 text-xs font-mono text-sand">
          <ClockIcon className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>{currentTime.format('HH:mm:ss')}</span>
          <span className="text-mist text-[11px] font-sans">
            {currentTime.format('DD/MM')}
          </span>
        </div>

        {/* Quick Status Pill: Online PCs & Pending Orders */}
        <div className="hidden md:flex items-center gap-3 px-3.5 py-1 rounded-full bg-slate/40 border border-mist/15 text-xs shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_rgba(76,175,80,0.8)]" />
            <span className="text-mist">Máy online:</span>
            <span className="font-bold font-mono text-sand">
              {quickStats?.activeSessionsCount || 0}/{quickStats?.totalComputers || 0}
            </span>
          </div>
          <span className="text-mist/30">|</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                pendingCount > 0 ? 'bg-danger animate-ping' : 'bg-mist/40'
              }`}
            />
            <span className="text-mist">Đơn chờ:</span>
            <span
              className={`font-bold font-mono ${
                pendingCount > 0 ? 'text-danger' : 'text-mist'
              }`}
            >
              {pendingCount}
            </span>
          </div>
        </div>

        {/* Nút Toggle Âm Thanh Chuông Báo Đơn */}
        <Tooltip
          title={isSoundMuted ? 'Âm thanh thông báo: Đang TẮT (Bấm để bật)' : 'Âm thanh thông báo: Đang BẬT'}
          placement="bottom"
        >
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${
              isSoundMuted
                ? 'bg-midnight/70 border-mist/20 text-mist/60 hover:text-sand'
                : 'bg-gold/15 border-gold/40 text-gold hover:bg-gold/25'
            }`}
            aria-label="Bật tắt âm thanh chuông"
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </Tooltip>

        {/* Notification Bell với Popover Danh Sách Đơn Chờ Duyệt */}
        <Popover
          trigger="click"
          placement="bottomRight"
          styles={{
            content: {
              backgroundColor: '#202332',
              padding: '12px',
              borderRadius: '16px',
              border: '1px solid rgba(189,152,117,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
          }}
          content={
            <div className="w-72 text-sand select-none">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-mist/15">
                <span className="font-bold text-xs flex items-center gap-1.5 text-sand">
                  <Bell className="w-3.5 h-3.5 text-gold" />
                  Đơn hàng chờ duyệt
                </span>
                <span className="text-[11px] font-mono text-gold font-bold">
                  {pendingCount} đơn
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-6 text-center text-xs text-mist">
                  Không có đơn hàng nào chờ duyệt
                </div>
              ) : (
                <div className="space-y-1.5 mb-2.5">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate('/staff/orders')}
                      className="p-2.5 rounded-xl bg-midnight/90 hover:bg-gold/15 border border-mist/15 transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sand font-mono">
                            #ORD-{order.id} • {order.computerCode}
                          </span>
                          {order.computerZone && (
                            <ZoneBadge zone={order.computerZone} size="sm" short={true} />
                          )}
                        </div>
                        <span className="text-gold font-mono font-bold">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(order.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-mist mt-1">
                        <span className="truncate max-w-[120px]">{order.customerName}</span>
                        <span className="font-mono">{dayjs(order.createdAt).fromNow()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="primary"
                block
                size="small"
                onClick={() => navigate('/staff/orders')}
                className="h-8 rounded-lg text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none"
              >
                Vào hàng đợi xử lý ({pendingCount}) →
              </Button>
            </div>
          }
        >
          <button
            type="button"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate/40 hover:bg-gold/15 border border-mist/20 text-mist hover:text-gold transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            aria-label="Xem đơn hàng cần duyệt"
          >
            <Badge
              count={pendingCount}
              overflowCount={99}
              size="small"
              offset={[2, -2]}
              styles={{
                indicator: {
                  backgroundColor: pendingCount > 0 ? '#EF5350' : '#bd9875',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  boxShadow: pendingCount > 0 ? '0 0 10px rgba(239,83,80,0.85)' : '0 0 8px rgba(189,152,117,0.6)',
                },
              }}
            >
              <motion.div
                animate={
                  pendingCount > 0
                    ? {
                        rotate: [0, -14, 14, -10, 10, -4, 4, 0],
                        scale: [1, 1.15, 1.15, 1.15, 1.15, 1.05, 1.05, 1],
                      }
                    : { rotate: 0, scale: 1 }
                }
                transition={
                  pendingCount > 0
                    ? {
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: 'easeInOut',
                      }
                    : { duration: 0.2 }
                }
              >
                <Bell className={`w-4 h-4 ${pendingCount > 0 ? 'text-gold' : 'text-inherit'}`} />
              </motion.div>
            </Badge>
          </button>
        </Popover>
      </div>
    </header>
  );
};
