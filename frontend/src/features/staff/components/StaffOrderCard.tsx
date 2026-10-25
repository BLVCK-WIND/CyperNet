import React from 'react';
import { Button } from 'antd';
import {
  Clock,
  User,
  Monitor,
  CheckCircle2,
  XCircle,
  QrCode,
  Banknote,
  Sparkles,
  ChevronRight,
  Utensils,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { OrderResponse } from '@/types/order';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface StaffOrderCardProps {
  order: OrderResponse;
  onViewDetail: (order: OrderResponse) => void;
  onConfirmOrder?: (order: OrderResponse) => void;
  onCancelOrder?: (order: OrderResponse) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = ({
  order,
  onViewDetail,
  onConfirmOrder,
  onCancelOrder,
  isConfirming = false,
  isCancelling = false,
}) => {
  const { id, computerCode, customerName, customerPhone, totalAmount, paymentMethod, status, createdAt, items } = order;

  // Kiểm tra đơn mới đặt trong vòng 2 phút (chỉ áp dụng cho PENDING_PAYMENT)
  const isNew = status === 'PENDING_PAYMENT' && dayjs().diff(dayjs(createdAt), 'minute') <= 2;
  // Đơn chờ > 5 phút (Khẩn cấp cần duyệt ngay)
  const isUrgent = status === 'PENDING_PAYMENT' && dayjs().diff(dayjs(createdAt), 'minute') >= 5;

  // Format tiền VNĐ
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  // Tổng số lượng món
  const totalItemQuantity = items.reduce((acc, cur) => acc + cur.quantity, 0);

  return (
    <GlassCard
      onClick={() => onViewDetail(order)}
      className={`relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer select-none group hover:-translate-y-1 ${
        isUrgent
          ? 'border-warning shadow-[0_0_24px_rgba(255,183,77,0.45)] ring-2 ring-warning/60 bg-gradient-to-br from-[rgba(61,77,85,0.7)] to-[rgba(255,183,77,0.15)] animate-pulse'
          : isNew
          ? 'border-warning/60 shadow-[0_4px_24px_rgba(255,183,77,0.2)] bg-gradient-to-br from-[rgba(61,77,85,0.6)] to-[rgba(181,136,99,0.12)]'
          : status === 'PENDING_PAYMENT'
          ? 'border-gold/30 hover:border-gold/70 shadow-[0_4px_16px_rgba(0,0,0,0.3)] bg-[rgba(61,77,85,0.45)]'
          : status === 'CONFIRMED'
          ? 'border-success/30 hover:border-success/60 bg-[rgba(61,77,85,0.35)]'
          : 'border-danger/20 hover:border-danger/40 bg-[rgba(61,77,85,0.25)] opacity-70'
      }`}
    >
      {/* 1. Header: Mã Đơn, Huy hiệu MỚI & Trạng Thái */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-heading font-black text-lg text-sand group-hover:text-gold transition-colors">
            #ORD-{id}
          </span>

          {isUrgent ? (
            <span
              className="pill-badge text-[10px] font-extrabold bg-danger/25 text-danger border border-danger/60 animate-pulse shadow-[0_0_12px_rgba(239,83,80,0.5)]"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              CHỜ {dayjs().diff(dayjs(createdAt), 'minute')}P
            </span>
          ) : isNew ? (
            <span
              className="pill-badge text-[10px] font-extrabold bg-warning/25 text-warning border border-warning/50 animate-pulse shadow-[0_0_10px_rgba(255,183,77,0.4)]"
            >
              <Sparkles className="w-2.5 h-2.5" />
              MỚI
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status === 'PENDING_PAYMENT' ? (
            <span className="pill-badge text-[11px] font-extrabold bg-warning/25 text-[#FDBA74] border border-warning/60 shadow-[0_0_12px_rgba(255,183,77,0.3)]">
              CHỜ THANH TOÁN
            </span>
          ) : status === 'CONFIRMED' ? (
            <span className="pill-badge text-[11px] font-bold bg-success/20 text-[#4ADE80] border border-success/40">
              ĐÃ XÁC NHẬN
            </span>
          ) : (
            <span className="pill-badge text-[11px] font-medium bg-danger/15 text-danger border border-danger/30 opacity-70">
              ĐÃ HỦY
            </span>
          )}
        </div>
      </div>

      {/* 2. Vị trí Máy & Khách Hàng */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-midnight/60 border border-[rgba(167,158,156,0.1)] mb-3 text-xs">
        {/* Máy tính */}
        <div className="flex items-center gap-1.5 truncate">
          <Monitor className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="font-heading font-bold text-sand text-sm">
            {computerCode || 'Mang về'}
          </span>
        </div>

        {/* Thời gian đặt */}
        <div className="flex items-center justify-end gap-1 text-[11px] text-mist font-mono">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{dayjs(createdAt).fromNow()}</span>
        </div>

        {/* Tên khách */}
        <div className="flex items-center gap-1.5 text-sand font-medium truncate col-span-2 pt-1 border-t border-[rgba(167,158,156,0.08)]">
          <User className="w-3.5 h-3.5 text-mist shrink-0" />
          <span className="truncate">{customerName || 'Khách vãng lai'}</span>
          <span className="text-[11px] text-mist font-mono">({customerPhone})</span>
        </div>
      </div>

      {/* 3. Danh Sách Món (Hiển thị 2 món đầu tiên) */}
      <div className="space-y-1.5 py-1 mb-3">
        {items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs text-sand/90">
            <div className="flex items-center gap-2 truncate pr-2">
              {item.itemImageUrl || item.imageUrl ? (
                <img
                  src={item.itemImageUrl || item.imageUrl}
                  alt={item.itemName}
                  className="w-6 h-6 rounded-md object-cover border border-[rgba(167,158,156,0.2)] shrink-0"
                />
              ) : (
                <Utensils className="w-3.5 h-3.5 text-mist shrink-0" />
              )}
              <span className="truncate">{item.itemName}</span>
            </div>
            <span className="font-mono text-mist shrink-0">x{item.quantity}</span>
          </div>
        ))}

        {items.length > 2 && (
          <div className="text-[11px] text-gold font-medium italic">
            + và {items.length - 2} món khác...
          </div>
        )}
      </div>

      {/* 4. Tổng Tiền & Phương Thức Thanh Toán */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(167,158,156,0.1)] mb-3">
        <div className="flex items-center gap-1.5 text-xs text-mist">
          {paymentMethod === 'QR' ? (
            <span className="inline-flex items-center gap-1 text-[#85C1DC]">
              <QrCode className="w-3.5 h-3.5" />
              VietQR
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sand">
              <Banknote className="w-3.5 h-3.5 text-success" />
              Tiền mặt
            </span>
          )}
          <span className="text-mist/40">•</span>
          <span>{totalItemQuantity} món</span>
        </div>

        <span className="font-heading font-black text-lg text-gold font-mono">
          {formattedAmount}
        </span>
      </div>

      {/* 5. Nút Thao Tác (Quick Actions) */}
      {status === 'PENDING_PAYMENT' ? (
        <div
          className="grid grid-cols-2 gap-2.5 pt-1"
          onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra thẻ cha
        >
          <Button
            type="primary"
            icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
            loading={isConfirming}
            disabled={isConfirming || isCancelling}
            onClick={() => onConfirmOrder && onConfirmOrder(order)}
            className="rounded-full h-9 text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-extrabold border-none shadow-[0_2px_12px_rgba(181,136,99,0.35)] cursor-pointer"
          >
            Xác nhận
          </Button>

          <Button
            danger
            icon={<XCircle className="w-4 h-4" />}
            loading={isCancelling}
            disabled={isConfirming || isCancelling}
            onClick={() => onCancelOrder && onCancelOrder(order)}
            className="rounded-full h-9 text-xs bg-danger/10 border border-danger/40 text-danger font-bold hover:bg-danger hover:text-white cursor-pointer"
          >
            Hủy đơn
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-mist/70 pt-1 group-hover:text-gold transition-colors">
          <span>Xem lại chi tiết hóa đơn</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </GlassCard>
  );
};
