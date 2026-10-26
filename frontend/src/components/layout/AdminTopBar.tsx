import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Tooltip } from 'antd';
import {
  PanelLeft,
  Clock as ClockIcon,
  Store,
  ShieldCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useAuthStore } from '@/store/authStore';

dayjs.locale('vi');

interface AdminTopBarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const routeTitleMap: Record<string, { title: string; subtitle: string }> = {
  '/admin': {
    title: 'Tổng quan hệ thống (Admin Dashboard)',
    subtitle: 'Chỉ số KPI, doanh thu và vận hành phòng máy toàn diện',
  },
  '/admin/dashboard': {
    title: 'Tổng quan hệ thống (Admin Dashboard)',
    subtitle: 'Chỉ số KPI, doanh thu và vận hành phòng máy toàn diện',
  },
  '/admin/computers': {
    title: 'Quản lý máy trạm (Computers)',
    subtitle: 'Cấu hình danh mục máy, đơn giá theo giờ và trạng thái bảo trì',
  },
  '/admin/items': {
    title: 'Quản lý thực đơn F&B (Menu Items)',
    subtitle: 'Quản trị danh mục món ăn, thức uống, gói giờ và hình ảnh',
  },
  '/admin/accounts': {
    title: 'Quản lý tài khoản (Accounts & RBAC)',
    subtitle: 'Quản lý danh sách nhân viên, khách hàng và cấp quyền tài khoản',
  },
  '/admin/reports/revenue': {
    title: 'Báo cáo tài chính & Doanh thu',
    subtitle: 'Biểu đồ tăng trưởng, doanh thu theo ngày và cơ cấu dòng tiền',
  },
  '/admin/reports/computers': {
    title: 'Báo cáo hiệu suất máy trạm',
    subtitle: 'Thống kê tần suất phục vụ, giờ chơi thực tế và tỷ lệ lấp đầy',
  },
};

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Cập nhật đồng hồ hệ thống mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentRouteMeta = routeTitleMap[location.pathname] || {
    title: 'Trang Quản Trị Hệ Thống',
    subtitle: 'Hệ thống quản lý phòng máy CyberNet',
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-mist/15 bg-midnight/90 backdrop-blur-md z-20 shrink-0">
      {/* 1. Left: Mobile/Tablet Collapse Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-mist hover:text-gold hover:bg-gold/15 transition-colors cursor-pointer"
          aria-label={collapsed ? 'Mở sidebar' : 'Thu sidebar'}
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-mist font-medium">
            <span>Admin</span>
            <span>/</span>
            <span className="text-sand font-semibold truncate">
              {currentRouteMeta.title.split('(')[0].trim()}
            </span>
          </div>
          <span className="text-[11px] text-mist/70 hidden sm:block truncate">
            {currentRouteMeta.subtitle}
          </span>
        </div>
      </div>

      {/* 2. Right: Quick Switch to Staff, Clock & Profile Pill */}
      <div className="flex items-center gap-3">
        {/* Nút chuyển nhanh sang ca trực quầy thu ngân */}
        <Tooltip title="Mở sơ đồ máy quầy thu ngân">
          <Button
            type="text"
            icon={<Store className="w-4 h-4 text-gold" />}
            onClick={() => navigate('/staff/floormap')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate/40 border border-gold/30 hover:border-gold hover:bg-gold/20 hover:shadow-[0_0_12px_rgba(189,152,117,0.25)] text-xs text-sand font-medium transition-all"
          >
            <span className="hidden md:inline">Vận hành Quầy</span>
          </Button>
        </Tooltip>

        {/* Đồng hồ hệ thống */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate/40 border border-mist/20 text-xs font-mono text-sand shadow-inner">
          <ClockIcon className="w-3.5 h-3.5 text-gold" />
          <span>{currentTime.format('HH:mm:ss')}</span>
          <span className="text-[10px] text-mist font-sans ml-1">
            {currentTime.format('DD/MM')}
          </span>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-xs font-semibold text-gold shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" />
          <span className="hidden xs:inline">{user?.name || 'Administrator'}</span>
        </div>
      </div>
    </header>
  );
};
