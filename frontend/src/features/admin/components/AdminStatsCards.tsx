import React from 'react';
import { Alert, Button, Skeleton, Tooltip } from 'antd';
import { Coins, Monitor, PlayCircle, ShoppingBag, RefreshCw, Activity } from 'lucide-react';
import { useAdminStats } from '../hooks/useAdminStats';
import { vietnamTime } from '@/utils/vietnamTime';

interface QueryState {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  refetch: () => unknown;
}

function StatsCard({ title, className, icon, query, children, footer }: {
  title: string; className: string; icon: React.ReactNode; query: QueryState;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return <section className={`${className} flex flex-col justify-between gap-3`} aria-label={title}>
    <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase text-sand/90">
      <span>{title}</span>{icon}
    </div>
    {query.isPending ? <Skeleton.Input active size="small" />
      : <div className="text-2xl sm:text-3xl font-heading font-black text-sand">{children}</div>}
    <div className="text-xs text-mist rounded-xl bg-black/20 p-2.5">{footer}</div>
    {query.isError && <Alert type="error" title="Không tải được dữ liệu"
      action={<Button size="small" loading={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button>} />}
    <div className="text-[11px] text-mist/80 font-mono">
      {query.dataUpdatedAt > 0
        ? `${query.isError ? 'Lần tải thành công' : 'Cập nhật'}: ${vietnamTime(query.dataUpdatedAt)}`
        : 'Chưa có lần tải thành công'}
    </div>
  </section>;
}

export const AdminStatsCards: React.FC = () => {
  const { today, revenueQuery, computersQuery, sessionsQuery, isFetching, refetch } = useAdminStats();
  const revenue = revenueQuery.isError ? undefined : revenueQuery.data;
  const computers = computersQuery.isError ? undefined : computersQuery.data;
  const sessions = sessionsQuery.isError ? undefined : sessionsQuery.data;
  const number = (value: number | undefined) => value ?? '—';
  const money = (value: number | undefined) => value === undefined ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  return <div className="space-y-3.5 select-none">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-mist">
        <Activity className="w-4 h-4 text-gold" />
        <span className="text-gold font-bold">BÁO CÁO NHANH VẬN HÀNH</span>
        <span>{today} • Giờ Việt Nam</span>
      </div>
      <Tooltip title="Làm mới cả ba nguồn dữ liệu">
        <Button size="small" loading={isFetching} onClick={() => void refetch()}
          icon={<RefreshCw className="w-3.5 h-3.5" />}>Làm mới</Button>
      </Tooltip>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
      <StatsCard title="Doanh thu thực thu hôm nay" className="liquid-glass-sunset"
        icon={<Coins className="w-4 h-4 text-gold" />} query={revenueQuery}
        footer={<>TM: {money(revenue?.cashRevenue)} • QR: {money(revenue?.qrRevenue)}</>}>
        {money(revenue?.totalRevenue)}
      </StatsCard>
      <StatsCard title="Công suất phòng máy" className="liquid-glass-sand"
        icon={<Monitor className="w-4 h-4 text-gold" />} query={computersQuery}
        footer={<>Lấp đầy: {number(computers?.occupancyRate)}% • Trống: {number(computers?.available)} • Bảo trì: {number(computers?.maintenance)}</>}>
        {number(computers?.active)} / {number(computers?.total)} <span className="text-sm font-normal">máy</span>
      </StatsCard>
      <StatsCard title="Phiên chơi trực tiếp" className="liquid-glass-cyan"
        icon={<PlayCircle className="w-4 h-4 text-gold" />} query={sessionsQuery}
        footer="Số phiên đang hoạt động trên toàn bộ hệ thống">
        {number(sessions)} <span className="text-sm font-normal">phiên</span>
      </StatsCard>
      <StatsCard title="Giao dịch hôm nay" className="liquid-glass-amber"
        icon={<ShoppingBag className="w-4 h-4 text-gold" />} query={revenueQuery}
        footer={<>Nạp giờ quầy POS: {number(revenue?.totalTimePurchases)} lượt</>}>
        {number(revenue?.totalOrders)} <span className="text-sm font-normal">đơn đã thanh toán</span>
      </StatsCard>
    </div>
  </div>;
};
