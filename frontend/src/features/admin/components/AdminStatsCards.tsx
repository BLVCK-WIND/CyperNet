import React, { useState, useEffect } from 'react';
import { Skeleton, Tooltip, Tag } from 'antd';
import {
  Coins,
  Monitor,
  PlayCircle,
  ShoppingBag,
  RefreshCw,
  Percent,
  Activity,
  Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAdminStats } from '../hooks/useAdminStats';

export const AdminStatsCards: React.FC = () => {
  const { stats, isLoading, isFetching, refetch } = useAdminStats();
  const [lastUpdated, setLastUpdated] = useState<string>(() => dayjs().format('HH:mm:ss'));

  useEffect(() => {
    if (!isFetching) {
      setLastUpdated(dayjs().format('HH:mm:ss'));
    }
  }, [isFetching]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val);
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* 1. Header Bar: Tiêu đề Báo Cáo Nhanh & Thời gian cập nhật */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-[11px] font-bold text-gold tracking-wide">
            <Activity className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span>BÁO CÁO NHANH VẬN HÀNH</span>
          </div>
          <span className="text-xs text-mist font-medium hidden sm:inline">
            • Dữ liệu thời gian thực hôm nay ({dayjs().format('DD/MM/YYYY')})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-mist/70 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-mist/50" />
            Cập nhật lúc: <strong className="text-sand/90">{lastUpdated}</strong>
          </span>

          <Tooltip title="Làm mới chỉ số ngay lập tức">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl twinkle-btn-secondary text-xs text-mist hover:text-gold cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-gold' : ''}`} />
              <span>{isFetching ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Dải 4 Thẻ Báo Cáo Nhanh (Liquid Glass Telemetry - Sắc thái phối màu chuẩn) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {/* KPI 1: CAM HOÀNG HÔN / ĐỎ SAN HÔ & ĐEN TUYỀN (Sunset Orange / Fiery Coral) */}
        <div className="liquid-glass-sunset flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#fb923c]" />
                Doanh thu thực thu
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-pulse" />
            </div>

            {isLoading ? (
              <Skeleton.Input active size="small" className="w-32 h-8 rounded-lg my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-heading font-black text-[#fed7aa] drop-shadow-[0_2px_8px_rgba(234,88,12,0.5)] tracking-tight">
                {formatCurrency(stats?.todayRevenue || 0)}
              </div>
            )}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-3 py-1.5">
            <span className="text-sand/80">
              TM: <strong className="text-[#fb923c] font-bold">{formatCurrency(stats?.cashRevenue || 0)}</strong>
            </span>
            <span className="text-sand/80">
              QR: <strong className="text-[#fdba74] font-bold">{formatCurrency(stats?.qrRevenue || 0)}</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: VÀNG CÁT NGÀ & XÁM DENIM */}
        <div className="liquid-glass-sand flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#e8d5c4]" />
                Công suất phòng máy
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shadow-[0_0_10px_rgba(74,222,128,0.9)] animate-pulse" />
            </div>

            {isLoading ? (
              <Skeleton.Input active size="small" className="w-28 h-8 rounded-lg my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-heading font-black text-[#f0ebe5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight flex items-baseline gap-1.5">
                <span className="text-[#4ADE80]">{stats?.activeComputers || 0}</span>
                <span className="text-base font-normal text-mist font-mono">
                  / {stats?.totalComputers || 0} máy
                </span>
              </div>
            )}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] backdrop-blur-md bg-black/20 rounded-xl px-3 py-1.5">
            <div className="flex items-center gap-1.5 text-mist">
              <Percent className="w-3 h-3 text-gold" />
              <span>Tỷ lệ lấp đầy:</span>
            </div>
            <Tag
              bordered={false}
              className="m-0 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-success/20 text-[#4ADE80] border border-success/30"
            >
              {stats?.occupancyRate || 0}%
            </Tag>
          </div>
        </div>

        {/* KPI 3: XANH CYAN ĐIỆN TỬ & LAM NGỌC SỐNG ĐỘNG (Electric Azure Cyan) */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
                Phiên chơi trực tiếp
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
            </div>

            {isLoading ? (
              <Skeleton.Input active size="small" className="w-24 h-8 rounded-lg my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-heading font-black text-[#e0f2fe] drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)] tracking-tight">
                <span className="text-[#38bdf8]">{stats?.activeSessionsCount || 0}</span>
                <span className="text-base font-normal text-mist font-sans ml-1.5">phiên</span>
              </div>
            )}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-mist font-mono backdrop-blur-md bg-black/20 rounded-xl px-3 py-1.5">
            <span>Sẵn sàng:</span>
            <span className="font-bold text-[#4ade80]">
              {stats?.availableComputers || 0} máy trống
            </span>
          </div>
        </div>

        {/* KPI 4: HỔ PHÁCH ĐẬM & KEM SỮA ẤM */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#e0a96d]" />
                Giao dịch hôm nay
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e0a96d] shadow-[0_0_10px_rgba(224,169,109,0.9)]" />
            </div>

            {isLoading ? (
              <Skeleton.Input active size="small" className="w-28 h-8 rounded-lg my-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-heading font-black text-sand drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] tracking-tight">
                <span className="text-[#f5d0a9]">{stats?.todayOrdersCount || 0}</span>
                <span className="text-base font-normal text-mist font-sans ml-1.5">đơn món</span>
              </div>
            )}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-mist font-mono backdrop-blur-md bg-black/20 rounded-xl px-3 py-1.5">
            <span>Nạp giờ quầy POS:</span>
            <span className="font-bold text-gold">
              +{stats?.todayTimePurchasesCount || 0} lượt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
