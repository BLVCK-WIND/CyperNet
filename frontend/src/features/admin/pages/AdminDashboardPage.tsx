import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Segmented, Progress } from 'antd';
import {
  Monitor,
  Utensils,
  Users,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Flame,
  CreditCard,
  Gamepad2,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PageTransition } from '@/components/animations/PageTransition';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AdminStatsCards } from '../components/AdminStatsCards';
import { RevenueAreaChart } from '../components/RevenueAreaChart';
import { reportApi } from '@/api/reportApi';
import { orderApi } from '@/api/orderApi';
import type { OrderStatus } from '@/types/order';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  useDocumentTitle('CyberNet • Bảng Quản Trị Hệ Thống');

  // Time preset cho Bento Chart
  const [timePreset, setTimePreset] = useState<string>('7D');

  const today = dayjs();
  const fromDateStr = timePreset === 'TODAY'
    ? today.format('YYYY-MM-DD')
    : timePreset === '30D'
    ? today.subtract(29, 'day').format('YYYY-MM-DD')
    : today.subtract(6, 'day').format('YYYY-MM-DD');
  const toDateStr = today.format('YYYY-MM-DD');

  // 1. Fetch Chuỗi Doanh Thu Cho Biểu Đồ Bento
  const { data: dailyRevenue = [] } = useQuery({
    queryKey: ['admin-dashboard-daily-revenue', fromDateStr, toDateStr],
    queryFn: () => reportApi.getDailyRevenue({ fromDate: fromDateStr, toDate: toDateStr }),
    refetchInterval: 15000,
  });

  // 2. Fetch Báo Cáo Tổng Quan (Nguồn Thu)
  const { data: summary } = useQuery({
    queryKey: ['admin-dashboard-summary', fromDateStr, toDateStr],
    queryFn: () => reportApi.getRevenueSummary({ fromDate: fromDateStr, toDate: toDateStr }),
    refetchInterval: 15000,
  });

  // 3. Fetch Hoạt Động Đơn Hàng Gần Đây (5 đơn mới nhất)
  const { data: recentOrdersData } = useQuery({
    queryKey: ['admin-dashboard-recent-orders'],
    queryFn: () => orderApi.getOrders({ size: 5, sort: 'id,desc' }),
    refetchInterval: 10000,
  });

  // 4. Fetch Top Món Bán Chạy (Top 5)
  const { data: topSellingItems = [] } = useQuery({
    queryKey: ['admin-dashboard-top-items', fromDateStr, toDateStr],
    queryFn: () => reportApi.getTopSellingItems(5, { fromDate: fromDateStr, toDate: toDateStr }),
    refetchInterval: 15000,
  });

  const recentOrders = recentOrdersData?.content || [];

  const adminModules = [
    {
      title: 'Quản Lý Máy Trạm',
      desc: 'Cấu hình giá phòng, zone STANDARD/VIP, và theo dõi trạng thái bảo trì',
      icon: <Monitor className="w-5 h-5 text-gold-light" />,
      path: '/admin/computers',
    },
    {
      title: 'Phân Khu Động',
      desc: 'Quản trị danh mục zone màu sắc, biểu phí mặc định và quy hoạch phòng',
      icon: <Layers className="w-5 h-5 text-gold-light" />,
      path: '/admin/zones',
    },
    {
      title: 'Thực Đơn & Dịch Vụ',
      desc: 'Quản trị danh mục món ăn, thức uống, gói giờ chơi và tải ảnh món',
      icon: <Utensils className="w-5 h-5 text-gold-light" />,
      path: '/admin/items',
    },
    {
      title: 'Tài Khoản & Nhân Viên',
      desc: 'Cấp tài khoản ca trực, phân quyền vai trò và đặt lại mật khẩu',
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

  // Tính tỷ trọng F&B vs Giờ chơi
  const totalRev = summary?.totalRevenue || 0;
  const fnbRev = summary?.totalOrderRevenue || 0;
  const playtimeRev = summary?.totalTimePurchaseRevenue || 0;
  const fnbPct = totalRev > 0 ? Math.round((fnbRev / totalRev) * 100) : 0;
  const playtimePct = totalRev > 0 ? Math.round((playtimeRev / totalRev) * 100) : 0;

  const renderOrderStatusTag = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return (
          <Tag color="warning" className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
            CHỜ DUYỆT
          </Tag>
        );
      case 'WAITING_CONFIRMATION':
        return (
          <Tag color="cyan" className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full border-0 bg-cyan-500/20 text-cyan-300 animate-pulse">
            ĐÃ CK
          </Tag>
        );
      case 'CONFIRMED':
        return (
          <Tag color="success" className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full border-0 bg-emerald-500/20 text-emerald-400">
            ĐÃ XONG
          </Tag>
        );
      case 'CANCELLED':
        return (
          <Tag color="default" className="m-0 text-[10px] font-bold px-2 py-0.5 rounded-full border-0 bg-white/10 text-mist">
            ĐÃ HỦY
          </Tag>
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. Executive Welcome Bar */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7 twinkle-hero-flow shadow-2xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-[11px] font-semibold text-sand shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-gold-light" />
                <span>EXECUTIVE MANAGEMENT HUB • SHADCN BENTO ARCHITECTURE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-sand">
                Bảng Điều Hành Trung Tâm, <span className="text-gold-light">{user?.name || 'Quản trị viên'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-sand/80 max-w-2xl font-normal leading-relaxed">
                Hệ thống phòng máy đang hoạt động theo thời gian thực. Theo dõi dòng tiền trực tiếp, kiểm soát vận hành và đưa ra quyết định kinh doanh chính xác.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/staff/floormap')}
                className="h-11 px-5 rounded-xl bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-2"
              >
                <span>Vào Quầy Thu Ngân</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Dải chỉ số vận hành trực tuyến 3D (Telemetry Strip) */}
        <AdminStatsCards />

        {/* 3. SHADCN BENTO GRID TẦNG 1: BIỂU ĐỒ DOANH THU & PHÂN BỔ NGUỒN THU */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cột lớn (2/3 width): Interactive AreaChart Doanh Thu */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mist/15 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Dòng Tiền Hoạt Động</span>
                </div>
                <h2 className="text-lg font-heading font-bold text-sand mt-0.5">
                  Xu Hướng Doanh Thu Thực Tế
                </h2>
                <p className="text-xs text-mist">
                  Dữ liệu phân rã Doanh thu F&B và Giờ chơi theo mốc thời gian ({fromDateStr} đến {toDateStr})
                </p>
              </div>

              <Segmented
                value={timePreset}
                onChange={(val) => setTimePreset(val as string)}
                options={[
                  { label: 'Hôm nay', value: 'TODAY' },
                  { label: '7 ngày qua', value: '7D' },
                  { label: '30 ngày qua', value: '30D' },
                ]}
                className="bg-midnight border border-mist/20 p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto"
              />
            </div>

            <div className="pt-4">
              <RevenueAreaChart data={dailyRevenue} height={280} />
            </div>

            <div className="pt-3 border-t border-mist/15 flex items-center justify-between text-xs text-mist">
              <span>Chu kỳ cập nhật: <strong>Mỗi 15 giây</strong></span>
              <button
                type="button"
                onClick={() => navigate('/admin/reports/revenue')}
                className="text-gold hover:text-gold-light font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem báo cáo chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Cột nhỏ (1/3 width): Phân Bổ Nguồn Thu & Phương Thức Thanh Toán */}
          <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <CreditCard className="w-4 h-4" />
                <span>Cơ Cấu Tài Chính</span>
              </div>
              <h2 className="text-lg font-heading font-bold text-sand mt-0.5">
                Nguồn Thu & Thanh Toán
              </h2>
              <p className="text-xs text-mist">
                Tỷ trọng đóng góp dòng tiền trong kỳ khảo sát
              </p>
            </div>

            {/* Doanh thu theo nguồn */}
            <div className="space-y-3 p-3.5 rounded-xl bg-black/25 border border-white/5">
              <div className="text-xs font-semibold text-sand/90 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-cyan-400" />
                  Món ăn & Đồ uống (F&B)
                </span>
                <span className="font-mono text-cyan-300 font-bold">{fnbPct}%</span>
              </div>
              <Progress
                percent={fnbPct}
                showInfo={false}
                strokeColor="#06b6d4"
                trailColor="rgba(255,255,255,0.06)"
                size="small"
              />

              <div className="text-xs font-semibold text-sand/90 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  Nạp giờ chơi máy trạm
                </span>
                <span className="font-mono text-emerald-300 font-bold">{playtimePct}%</span>
              </div>
              <Progress
                percent={playtimePct}
                showInfo={false}
                strokeColor="#10b981"
                trailColor="rgba(255,255,255,0.06)"
                size="small"
              />
            </div>

            {/* Phân bổ Tiền mặt vs VietQR */}
            <div className="space-y-2 p-3.5 rounded-xl bg-black/25 border border-white/5 text-xs">
              <div className="text-xs font-semibold text-sand/90 flex items-center justify-between border-b border-white/5 pb-2">
                <span>Phương thức thu tiền</span>
                <span className="font-mono text-gold font-bold">
                  {Number(totalRev).toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-mist flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Tiền mặt tại quầy (CASH):
                </span>
                <strong className="font-mono text-sand">
                  {Number(summary?.cashRevenue || 0).toLocaleString('vi-VN')} ₫
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-mist flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Chuyển khoản VietQR:
                </span>
                <strong className="font-mono text-cyan-300">
                  {Number(summary?.qrRevenue || 0).toLocaleString('vi-VN')} ₫
                </strong>
              </div>
            </div>

            <div className="text-[11px] text-mist/70 text-center">
              Khách hàng ưu tiên thanh toán qua ngân hàng VietQR tại bàn
            </div>
          </div>
        </div>

        {/* 4. SHADCN BENTO GRID TẦNG 2: HOẠT ĐỘNG ĐƠN HÀNG GẦN ĐÂY & TOP MÓN BÁN CHẠY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Cột trái: Đơn Hàng Gần Đây (Live Feed) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-mist/15 pb-3">
              <div>
                <h3 className="font-heading font-bold text-sand text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gold" />
                  Đơn Hàng Gần Đây (Live Activity)
                </h3>
                <p className="text-xs text-mist">
                  5 đơn gọi món & nạp giờ mới nhất từ các máy trạm
                </p>
              </div>

              <Button
                type="link"
                size="small"
                onClick={() => navigate('/staff/orders')}
                className="text-gold text-xs flex items-center gap-1 p-0 hover:text-gold-light"
              >
                <span>Hàng đợi đơn</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-2.5">
              {recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-mist">
                  Chưa có đơn hàng nào phát sinh gần đây
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-black/25 border border-white/5 hover:border-gold/30 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 text-gold flex items-center justify-center font-mono font-bold shrink-0">
                        #{order.id}
                      </div>
                      <div>
                        <div className="font-semibold text-sand flex items-center gap-1.5">
                          <span>Máy {order.computerCode || 'POS'}</span>
                          <span className="text-mist">•</span>
                          <span className="text-mist">{order.items?.length || 0} món</span>
                        </div>
                        <div className="text-[11px] text-mist/70 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-mist/50" />
                          {dayjs(order.createdAt).format('HH:mm DD/MM')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-gold text-sm">
                        {Number(order.totalAmount).toLocaleString('vi-VN')} ₫
                      </span>
                      {renderOrderStatusTag(order.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cột phải: Top Mặt Hàng Bán Chạy */}
          <div className="p-5 sm:p-6 rounded-2xl bg-midnight/90 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-mist/15 pb-3">
              <div>
                <h3 className="font-heading font-bold text-sand text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Top Món Bán Chạy Nhất
                </h3>
                <p className="text-xs text-mist">
                  Xếp hạng sản phẩm có số lượng đặt cao nhất trong kỳ
                </p>
              </div>

              <Button
                type="link"
                size="small"
                onClick={() => navigate('/admin/reports/revenue')}
                className="text-gold text-xs flex items-center gap-1 p-0 hover:text-gold-light"
              >
                <span>Xem xếp hạng</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-3">
              {topSellingItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-mist">
                  Chưa có dữ liệu món bán chạy trong kỳ này
                </div>
              ) : (
                topSellingItems.map((item, idx) => {
                  const maxQty = topSellingItems[0]?.totalQuantity || 1;
                  const pct = Math.round((item.totalQuantity / maxQty) * 100);
                  return (
                    <div key={item.itemId} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] ${
                              idx === 0
                                ? 'bg-amber-500 text-midnight font-bold'
                                : idx === 1
                                ? 'bg-slate-300 text-midnight'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-white/10 text-mist'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-sand line-clamp-1">
                            {item.itemName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-sand font-bold">{item.totalQuantity} phần</span>
                          <span className="text-gold font-bold">
                            {Number(item.totalRevenue).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>

                      <Progress
                        percent={pct}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#f59e0b',
                          '100%': '#bd9875',
                        }}
                        trailColor="rgba(255,255,255,0.06)"
                        size="small"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5. Command Dock: Phân Hệ Quản Trị Trực Quan */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sand/80 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold" />
              Lối Tắt Truy Cập Các Phân Hệ Quản Trị
            </h2>
            <Tag color="#bd9875" className="border-0 font-mono text-[10px] px-2.5 py-0.5 rounded-full text-midnight font-bold">
              6 Phân Hệ Hoạt Động
            </Tag>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((module) => (
              <div
                key={module.title}
                onClick={() => navigate(module.path)}
                className="p-4 sm:p-5 rounded-2xl twinkle-card-flow cursor-pointer flex flex-col justify-between group hover:border-gold/40 transition-all border border-white/5"
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

                <div className="pt-3.5 mt-2 border-t border-mist/15 flex items-center justify-between text-xs font-semibold text-sand/90 group-hover:text-gold transition-colors">
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
