import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Tooltip, App } from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Monitor,
  Layers,
  Utensils,
  Users,
  TrendingUp,
  Activity,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavMenuItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'gold' | 'info' | 'danger';
}

interface NavGroup {
  groupTitle: string;
  items: NavMenuItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, role } = useAuthStore();

  // Polling tỷ lệ máy online / tổng máy
  const { data: quickStats } = useQuery({
    queryKey: ['admin-quick-computer-stats'],
    queryFn: async () => {
      const [computersRes, sessionsRes] = await Promise.all([
        computerApi.getComputers({ size: 100 }),
        sessionApi.getSessions({ status: 'ACTIVE', size: 100 }),
      ]);
      const computers = computersRes.content || [];
      const inUseCount = computers.filter((c) => c.status === 'IN_USE').length;
      return {
        totalComputers: computersRes.totalElements || computers.length || 0,
        activeCount: inUseCount || sessionsRes.totalElements || sessionsRes.content?.length || 0,
      };
    },
    enabled: Boolean(isAuthenticated && role === 'ADMIN'),
    refetchInterval: 10000,
  });

  const totalComputers = quickStats?.totalComputers || 0;
  const activeComputers = quickStats?.activeCount || 0;

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          path: '/admin/dashboard',
          icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
        },
      ],
    },
    {
      groupTitle: 'QUẢN LÝ HỆ THỐNG',
      items: [
        {
          key: 'computers',
          label: 'Máy trạm',
          path: '/admin/computers',
          icon: <Monitor className="w-5 h-5 shrink-0" />,
          badge: totalComputers > 0 ? `${activeComputers}/${totalComputers}` : undefined,
          badgeVariant: 'gold',
        },
        {
          key: 'zones',
          label: 'Khu vực',
          path: '/admin/zones',
          icon: <Layers className="w-5 h-5 shrink-0" />,
        },
        {
          key: 'items',
          label: 'Thực đơn F&B',
          path: '/admin/items',
          icon: <Utensils className="w-5 h-5 shrink-0" />,
        },
        {
          key: 'accounts',
          label: 'Tài khoản',
          path: '/admin/accounts',
          icon: <Users className="w-5 h-5 shrink-0" />,
        },
      ],
    },
    {
      groupTitle: 'BÁO CÁO & THỐNG KÊ',
      items: [
        {
          key: 'reports-revenue',
          label: 'Doanh thu',
          path: '/admin/reports/revenue',
          icon: <TrendingUp className="w-5 h-5 shrink-0" />,
        },
        {
          key: 'reports-computers',
          label: 'Hiệu suất máy',
          path: '/admin/reports/computers',
          icon: <Activity className="w-5 h-5 shrink-0" />,
        },
      ],
    },
    {
      groupTitle: 'VẬN HÀNH QUẦY',
      items: [
        {
          key: 'staff-pos',
          label: 'Quầy thu ngân',
          path: '/staff/floormap',
          icon: <Store className="w-5 h-5 shrink-0" />,
          badge: 'Staff',
          badgeVariant: 'info',
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      message.success('Đã đăng xuất khỏi hệ thống quản trị.');
      navigate('/staff/login', { replace: true });
    } catch {
      navigate('/staff/login', { replace: true });
    }
  };

  return (
    <aside
      className={`relative flex flex-col justify-between shrink-0 h-screen transition-all duration-300 ease-in-out border-r z-30 select-none
        ${collapsed ? 'w-18' : 'w-64'}
        bg-midnight border-mist/20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]
      `}
    >
      {/* 1. Header: Brand Logo & Collapse Toggle */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-mist/15">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-midnight shadow-[0_0_16px_rgba(189,152,117,0.35)] shrink-0">
              <Sparkles className="w-5 h-5 text-midnight" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-heading font-bold tracking-wider text-sand text-base leading-tight">
                  CYBER<span className="text-gold">NET</span>
                </span>
                <span className="text-[10px] font-semibold text-gold tracking-widest uppercase">
                  Quản Trị Viên (Admin)
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-mist hover:text-gold hover:bg-gold/15 transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 2. Navigation Menu Groups */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]" aria-label="Admin navigation">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold tracking-wider text-mist/60 uppercase">
                  {group.groupTitle}
                </div>
              )}
              {collapsed && (
                <div className="w-6 h-[1px] bg-mist/10 mx-auto my-2" />
              )}
              {group.items.map((item) => {
                const navLinkElement = (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) => `
                      relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group
                      ${collapsed ? 'justify-center px-0' : ''}
                      ${
                        isActive
                          ? 'text-gold bg-gold/15 font-semibold shadow-[0_2px_12px_rgba(189,152,117,0.1)]'
                          : 'text-mist hover:text-sand hover:bg-slate/40'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active Indicator Bar bên trái */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-gold shadow-[0_0_8px_rgba(189,152,117,0.8)]" />
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
                                  ? 'bg-danger text-white animate-pulse'
                                  : item.badgeVariant === 'gold'
                                  ? 'bg-gold text-midnight'
                                  : 'bg-info/30 text-[#85C1DC] border border-info/40'
                              }`}
                            >
                              {item.badge}
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
                                    ? 'bg-danger/25 text-danger border border-danger/50'
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
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Footer: Thông tin Quản trị viên & Đăng xuất */}
      <div className="p-3 border-t border-mist/15 bg-midnight/70">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate/40 border border-mist/15
            ${collapsed ? 'justify-center p-2' : 'justify-between'}
          `}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gold/20 text-gold border border-gold/40 shrink-0">
              <UserIcon className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold border-2 border-midnight" />
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-sand truncate">
                  {user?.name || 'Quản trị viên'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-gold font-mono font-medium">
                  <ShieldCheck className="w-3 h-3 text-gold" />
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            )}
          </div>

          {collapsed ? (
            <Tooltip title="Đăng xuất" placement="right">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
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
              title="Đăng xuất Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
