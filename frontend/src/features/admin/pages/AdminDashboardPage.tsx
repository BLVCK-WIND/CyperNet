import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag } from 'antd';
import {
  LayoutDashboard,
  Monitor,
  Utensils,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PageTransition } from '@/components/animations/PageTransition';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AdminStatsCards } from '../components/AdminStatsCards';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  useDocumentTitle('CyberNet • Bảng Quản Trị Hệ Thống');

  const adminModules = [
    {
      title: 'Quản Lý Máy Trạm',
      desc: 'Cấu hình giá phòng, zone STANDARD/VIP, và theo dõi trạng thái bảo trì',
      icon: <Monitor className="w-5 h-5 text-gold-light" />,
      path: '/admin/computers',
    },
    {
      title: 'Thực Đơn & Dịch Vụ',
      desc: 'Quản trị danh mục món ăn, thức uống, gói giờ chơi và ảnh đại diện',
      icon: <Utensils className="w-5 h-5 text-gold-light" />,
      path: '/admin/items',
    },
    {
      title: 'Tài Khoản & Nhân Viên',
      desc: 'Cấp tài khoản ca trực cho nhân viên, quản lý số dư khách hàng và mật khẩu',
      icon: <Users className="w-5 h-5 text-gold-light" />,
      path: '/admin/accounts',
    },
    {
      title: 'Báo Cáo Doanh Thu',
      desc: 'Thống kê tổng hợp doanh thu theo ngày, cơ cấu tiền giờ và dịch vụ F&B',
      icon: <TrendingUp className="w-5 h-5 text-gold-light" />,
      path: '/admin/reports/revenue',
    },
    {
      title: 'Hiệu Suất Máy Trạm',
      desc: 'Báo cáo số lượt phục vụ, tổng thời lượng sử dụng và tỷ lệ lấp đầy',
      icon: <Activity className="w-5 h-5 text-gold-light" />,
      path: '/admin/reports/computers',
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Welcome Hero Banner - Ambient Lighting Twinkle */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 twinkle-hero-flow shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-xs font-semibold text-sand shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                <span>PHÂN HỆ QUẢN TRỊ TRUNG TÂM</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-sand">
                Chào mừng trở lại, <span className="text-gold-light drop-shadow-sm">{user?.name || 'Quản trị viên'}</span>!
              </h1>
              <p className="text-sm text-sand/80 max-w-2xl leading-relaxed font-normal">
                Hệ thống quản lý phòng máy CyberNet đang hoạt động ổn định. Bạn có toàn quyền thiết lập cấu hình máy trạm, thực đơn, quản lý tài khoản và xem báo cáo tài chính chuyên sâu.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/staff/floormap')}
                className="h-11 px-5 rounded-full bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-2 transition-all duration-300"
              >
                <span>Vào Sơ Đồ Máy</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Chỉ số vận hành nhanh trực tuyến (MS-3.2) */}
        <AdminStatsCards />

        {/* 3. Danh mục phân hệ quản trị */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sand flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-gold" />
              Danh Mục Chức Năng Quản Trị
            </h2>
            <Tag color="#bd9875" className="border-0 font-mono text-xs px-2.5 py-0.5 rounded-full text-midnight font-bold">
              Phase 3 • Admin Panel
            </Tag>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((module) => (
              <div
                key={module.title}
                onClick={() => navigate(module.path)}
                className="p-5 rounded-2xl twinkle-card-flow cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="twinkle-icon-box">
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sand text-base group-hover:text-gold transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-sand/75 mt-1 leading-relaxed font-normal">
                      {module.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-mist/20 flex items-center justify-between text-xs font-semibold text-sand/90 group-hover:text-gold transition-colors">
                  <span>Mở phân hệ</span>
                  <div className="twinkle-arrow-capsule">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboardPage;
