import React from 'react';
import { Tag, Button } from 'antd';
import { QrCode, Coins, Clock, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { GlassCard } from '@/components/ui/GlassCard';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import type { OrderResponse, OrderStatus } from '@/types/order';

interface OrderCardProps {
  order: OrderResponse;
  onViewDetail: (order: OrderResponse) => void;
  onOpenQr: (order: OrderResponse) => void;
  isLoadingQr?: boolean;
}

const getStatusBadge = (status: OrderStatus, paymentMethod?: string) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      if (paymentMethod === 'QR') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-ping" />
            CHỜ CHUYỂN KHOẢN
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-amber-400 text-midnight shadow-[0_0_12px_rgba(251,191,36,0.35)]">
          <span className="w-1.5 h-1.5 rounded-full bg-midnight shrink-0" />
          CHỜ XỬ LÝ
        </span>
      );
    case 'WAITING_CONFIRMATION':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          CHỜ XÁC NHẬN (ĐÃ CK)
        </span>
      );
    case 'CONFIRMED':
      return (
        <Tag
          color="#4CAF50"
          className="m-0 font-semibold text-[11px] px-2.5 py-0.5 border-0"
        >
          ĐÃ HOÀN THÀNH
        </Tag>
      );
    case 'CANCELLED':
      return (
        <Tag
          color="#EF5350"
          className="m-0 font-semibold text-[11px] px-2.5 py-0.5 border-0"
        >
          ĐÃ HỦY
        </Tag>
      );
    default:
      return <Tag className="m-0 font-semibold text-[11px]">{status}</Tag>;
  }
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetail,
  onOpenQr,
  isLoadingQr = false,
}) => {
  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.totalAmount);

  const formattedTime = dayjs(order.createdAt).format('HH:mm - DD/MM/YYYY');

  // Rút gọn danh sách tên món
  const itemsSummary = order.items
    ?.map((i) => `${i.itemName} x${i.quantity}`)
    .join(', ') || 'Chi tiết đơn hàng';

  const canShowQr =
    order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'QR';

  return (
    <GlassCard
      elevated
      className="p-4 rounded-xl border-mist/15 hover:border-gold/30 transition-all duration-300 space-y-3"
    >
      {/* Header: Order ID, Time & Status */}
      <div className="flex items-center justify-between border-b border-mist/10 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-['Space_Grotesk'] text-base font-bold text-sand">
            Đơn #{order.id}
          </span>
          {order.computerCode && (
            <span className="text-xs font-mono font-bold text-gold">
              ({order.computerCode})
            </span>
          )}
          {order.computerZone && (
            <ZoneBadge zone={order.computerZone} size="sm" short={false} />
          )}
          <span className="text-[11px] text-mist flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {formattedTime}
          </span>
        </div>
        {getStatusBadge(order.status, order.paymentMethod)}
      </div>

      {/* Items Summary */}
      <div>
        <p className="text-xs text-sand/90 line-clamp-2 leading-relaxed font-medium">
          {itemsSummary}
        </p>
      </div>

      {/* Footer: Payment Method, Total & Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-mist/10">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-mist mb-0.5">
            {order.paymentMethod === 'QR' ? (
              <>
                <QrCode className="w-3.5 h-3.5 text-gold" />
                <span>VietQR</span>
              </>
            ) : (
              <>
                <Coins className="w-3.5 h-3.5 text-gold" />
                <span>Tiền mặt</span>
              </>
            )}
          </div>
          <span className="text-base font-bold text-gold font-['Space_Grotesk']">
            {formattedTotal}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canShowQr && (
            <Button
              type="primary"
              size="small"
              loading={isLoadingQr}
              disabled={isLoadingQr}
              icon={<QrCode className="w-3.5 h-3.5 text-midnight" />}
              onClick={() => onOpenQr(order)}
              className="bg-gold hover:bg-gold-light text-midnight font-bold border-0 text-xs h-8 px-3 rounded-lg shadow-sm"
            >
              Mã QR
            </Button>
          )}

          <Button
            size="small"
            onClick={() => onViewDetail(order)}
            className="bg-slate/60 hover:bg-slate text-sand border-mist/20 text-xs h-8 px-2.5 rounded-lg flex items-center gap-1"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default OrderCard;
