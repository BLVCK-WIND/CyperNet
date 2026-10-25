import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Tooltip, App } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  Monitor,
  ReceiptText,
  Clock,
  History,
  LogOut,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { orderApi } from '@/api/orderApi';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';

interface StaffSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavMenuItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'danger' | 'gold' | 'info';
  isPulse?: boolean;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, role } = useAuthStore();

  // 1. Polling số đơn hàng PENDING_PAYMENT chờ duyệt mỗi 5s
  const { data: pendingOrdersData } = useQuery({
    queryKey: ['staff-topbar-pending-orders'],
    queryFn: () => orderApi.getOrders({ status: 'PENDING_PAYMENT', page: 0, size: 1 }),
    enabled: Boolean(isAuthenticated && (role === 'STAFF' || role === 'ADMIN')),
    refetchInterval: 5000,
  });
  const pendingCount = pendingOrdersData?.totalElements || 0;

  // 2. Polling tỷ lệ máy online / tổng máy
  const { data: floorData } = useQuery({
    queryKey: ['staff-floormap-data'],
    queryFn: async () => {
      const [computersRes, sessionsRes] = await Promise.all([
        computerApi.getComputers({ size: 100 }),
        sessionApi.getSessions({ status: 'ACTIVE', size: 100 }),
      ]);
      return {
        totalComputers: computersRes.totalElements || computersRes.content?.length || 0,
        activeSessions: sessionsRes.totalElements || sessionsRes.content?.length || 0,
      };
    },
    enabled: Boolean(isAuthenticated && (role === 'STAFF' || role === 'ADMIN')),
    refetchInterval: 10000,
  });

  const totalComputers = floorData?.totalComputers || 0;
  const activeComputers = floorData?.activeSessions || 0;

  const menuItems: NavMenuItem[] = [
    {
      key: 'floormap',
      label: 'Sơ đồ máy',
      path: '/staff/floormap',
      icon: <Monitor className="w-5 h-5 shrink-0" />,
      badge: totalComputers > 0 ? `${activeComputers}/${totalComputers}` : undefined,
      badgeVariant: 'gold',
    },
    {
      key: 'orders',
      label: 'Đơn hàng',
      path: '/staff/orders',
      icon: <ReceiptText className="w-5 h-5 shrink-0" />,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeVariant: 'danger',
      isPulse: pendingCount > 0,
    },
    {
      key: 'sell-time',
      label: 'Bán giờ',
      path: '/staff/sell-time',
      icon: <Clock className="w-5 h-5 shrink-0" />,
    },
    {
      key: 'sessions',
      label: 'Phiên chơi',
      path: '/staff/sessions',
      icon: <History className="w-5 h-5 shrink-0" />,
      badge: activeComputers > 0 ? activeComputers : undefined,
      badgeVariant: 'info',
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      message.success('Đã đăng xuất khỏi ca trực.');
      navigate('/staff/login', { replace: true });
    } catch {
      navigate('/staff/login', { replace: true });
    }
  };

  return (
    <aside
      className={`relative flex flex-col justify-between shrink-0 h-screen transition-all duration-300 ease-in-out border-r z-30 select-none
        ${collapsed ? 'w-18' : 'w-60'}
        bg-midnight border-[rgba(167,158,156,0.15)] shadow-[4px_0_24px_rgba(0,0,0,0.4)]
      `}
    >
      {/* 1. Header: Brand Logo & Collapse Toggle */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-[rgba(167,158,156,0.12)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-midnight shadow-[0_0_16px_rgba(181,136,99,0.35)] shrink-0">
              <Sparkles className="w-5 h-5 text-midnight" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-heading font-bold tracking-wider text-sand text-base leading-tight">
                  CYBER<span className="text-gold">NET</span>
                </span>
                <span className="text-[11px] font-medium text-mist tracking-widest uppercase">
                  Staff Quầy POS
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-mist hover:text-gold hover:bg-[rgba(181,136,99,0.12)] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 2. Navigation Menu */}
        <nav className="p-3 space-y-1.5" aria-label="Staff navigation">
          {menuItems.map((item) => {
            const navLinkElement = (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group
                  ${collapsed ? 'justify-center px-0' : ''}
                  ${
                    isActive
                      ? 'text-gold bg-[rgba(181,136,99,0.14)] font-semibold shadow-[0_2px_12px_rgba(181,136,99,0.08)]'
                      : 'text-mist hover:text-sand hover:bg-[rgba(61,77,85,0.45)]'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Indicator Bar bên trái */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gold shadow-[0_0_8px_rgba(181,136,99,0.8)]" />
                    )}

                    <div className="relative flex items-center justify-center">
                      <span
                        className={`transition-colors ${
                          isActive
                            ? 'text-gold'
                            : 'text-mist group-hover:text-sand'
                        }`}
                      >
                        {item.icon}
                      </span>

                      {/* Floating Mini Badge when Collapsed */}
                      {collapsed && item.badge !== undefined && (
                        <span
                          className={`absolute -top-1.5 -right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono flex items-center justify-center leading-tight shadow-md ${
                            item.badgeVariant === 'danger'
                              ? 'bg-danger text-white animate-pulse shadow-[0_0_8px_rgba(239,83,80,0.8)]'
                              : item.badgeVariant === 'gold'
                              ? 'bg-gold text-midnight'
                              : 'bg-info/30 text-[#85C1DC] border border-info/40'
                          }`}
                        >
                          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                              item.badgeVariant === 'danger'
                                ? 'bg-danger/25 text-danger border border-danger/50 animate-pulse shadow-[0_0_10px_rgba(239,83,80,0.4)]'
                                : item.badgeVariant === 'gold'
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'bg-info/20 text-[#85C1DC] border border-info/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );

            const tooltipTitle = item.badge !== undefined 
              ? `${item.label} (${item.badge})` 
              : item.label;

            return collapsed ? (
              <Tooltip key={item.key} title={tooltipTitle} placement="right">
                <div>{navLinkElement}</div>
              </Tooltip>
            ) : (
              <div key={item.key}>{navLinkElement}</div>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer: Thông tin Nhân viên & Đăng xuất */}
      <div className="p-3 border-t border-[rgba(167,158,156,0.12)] bg-[rgba(16,35,42,0.6)]">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-[rgba(61,77,85,0.4)] border border-[rgba(167,158,156,0.1)]
            ${collapsed ? 'justify-center p-2' : 'justify-between'}
          `}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(181,136,99,0.18)] text-gold border border-[rgba(181,136,99,0.3)] shrink-0">
              <User className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border-2 border-midnight" />
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-sand truncate">
                  {user?.name || 'Nhân viên quầy'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-mist font-mono">
                  <ShieldCheck className="w-3 h-3 text-gold" />
                  {user?.role || 'STAFF'}
                </span>
              </div>
            )}
          </div>

          {collapsed ? (
            <Tooltip title="Đăng xuất" placement="right">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất khỏi ca trực"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-mist hover:text-danger hover:bg-[rgba(239,83,80,0.12)] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Đăng xuất"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-mist hover:text-danger hover:bg-[rgba(239,83,80,0.12)] transition-colors cursor-pointer"
              title="Đăng xuất ca trực"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
