import React from 'react';
import { Button, Tooltip } from 'antd';
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
  Zap,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { GlassCard } from '@/components/ui/GlassCard';
import { ZoneBadge } from '@/components/common/ZoneBadge';
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
  isFlashNew?: boolean;
}

export const StaffOrderCard: React.FC<StaffOrderCardProps> = ({
  order,
  onViewDetail,
  onConfirmOrder,
  onCancelOrder,
  isConfirming = false,
  isCancelling = false,
  isFlashNew = false,
}) => {
  const { id, computerCode, computerZone, customerName, customerPhone, totalAmount, paymentMethod, status, createdAt, items } = order;

  // Kiểm tra đơn mới đặt trong vòng 2 phút (chỉ áp dụng cho PENDING_PAYMENT)
  const isNew = status === 'PENDING_PAYMENT' && dayjs().diff(dayjs(createdAt), 'minute') <= 2;
  // Đơn chờ > 5 phút (Khẩn cấp cần duyệt ngay)
  const isUrgent = status === 'PENDING_PAYMENT' && dayjs().diff(dayjs(createdAt), 'minute') >= 5;

  // Phân loại đơn: Đồ ăn/uống vs Giờ chơi vs Combo
  const hasPlaytime = items.some((it) => it.itemType === 'PLAYTIME');
  const hasFoodOrDrink = items.some((it) => it.itemType !== 'PLAYTIME');
  const isCombo = hasPlaytime && hasFoodOrDrink;
  const isPlaytimeOnly = hasPlaytime && !hasFoodOrDrink;

  // Format tiền VNĐ
  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  // Tổng số lượng món
  const totalItemQuantity = items.reduce((acc, cur) => acc + cur.quantity, 0);

  // Xác định phong cách thị giác theo từng loại đơn (F&B ấm áp vs Nạp giờ Cyber)
  const getCardThemeClasses = () => {
    // 1. Phân loại theo loại đơn
    let themeBgBorder = '';
    if (isPlaytimeOnly) {
      themeBgBorder =
        'border-l-4 border-l-cyan-400 border-t border-r border-b border-cyan-500/35 bg-gradient-to-br from-[#122433]/90 via-[#18202e]/95 to-[#131622]/95 hover:border-cyan-400/70 shadow-[0_4px_20px_rgba(6,182,212,0.12)] hover:shadow-[0_8px_24px_rgba(6,182,212,0.25)]';
    } else if (isCombo) {
      themeBgBorder =
        'border-l-4 border-l-emerald-400 border-t border-r border-b border-emerald-500/35 bg-gradient-to-br from-[#132724]/90 via-[#18212d]/95 to-[#131622]/95 hover:border-emerald-400/70 shadow-[0_4px_20px_rgba(16,185,129,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.22)]';
    } else {
      // F&B Only (Bếp)
      themeBgBorder =
        'border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/35 bg-gradient-to-br from-[#27201b]/90 via-[#1e202c]/95 to-[#141622]/95 hover:border-amber-400/70 shadow-[0_4px_20px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_24px_rgba(245,158,11,0.18)]';
    }

    // 2. Trạng thái vừa xuất hiện (Flash highlight 2-3s): viền vàng ánh kim nổi bật 3s, KHÔNG đổi opacity
    if (isFlashNew) {
      return `${themeBgBorder} ring-2 ring-gold shadow-[0_0_28px_rgba(189,152,117,0.55)] transition-all duration-500`;
    }

    // 3. Trạng thái khẩn cấp (chờ > 5p): Viền hổ phách thở nhẹ nhàng (+10-15% lively), 100% sắc nét
    if (isUrgent) {
      return `${themeBgBorder} animate-pulse-urgent-border`;
    }
    if (isNew) {
      return `${themeBgBorder} ring-1.5 ring-gold/50 shadow-[0_0_12px_rgba(189,152,117,0.2)]`;
    }

    // 4. Trạng thái đã hủy (giảm opacity nhẹ)
    if (status === 'CANCELLED') {
      return `${themeBgBorder} opacity-75 grayscale-[20%]`;
    }

    return themeBgBorder;
  };

  return (
    <GlassCard
      onClick={() => onViewDetail(order)}
      className={`relative p-5 rounded-2xl transition-all duration-300 cursor-pointer select-none group hover:-translate-y-1 ${getCardThemeClasses()}`}
    >
      {/* Huy hiệu Flash Đơn mới (hiện 2-3s trên nóc thẻ) */}
      {isFlashNew && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-gold to-amber-400 text-midnight shadow-md shadow-gold/40 uppercase tracking-wider z-10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-midnight animate-ping" />
          <span>⚡ ĐƠN MỚI ĐẾN</span>
        </span>
      )}

      {/* 1. Header: Mã Đơn, Huy hiệu MỚI & Trạng Thái */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-heading font-black text-lg text-sand group-hover:text-gold transition-colors">
            #ORD-{id}
          </span>

          {isUrgent ? (
            <span className="pill-badge text-[10px] font-extrabold bg-danger/25 text-rose-200 border border-danger/60 shadow-sm inline-flex items-center gap-1.5 animate-pulse-badge-red">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>CHỜ {dayjs().diff(dayjs(createdAt), 'minute')}P</span>
            </span>
          ) : isNew ? (
            <span className="pill-badge text-[10px] font-extrabold bg-warning/20 text-warning border border-warning/40 shadow-sm inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-warning" />
              <span>MỚI</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status === 'PENDING_PAYMENT' ? (
            paymentMethod === 'QR' ? (
              <span className="pill-badge text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span>CHỜ CHUYỂN KHOẢN</span>
              </span>
            ) : (
              <span className="pill-badge text-[11px] font-extrabold bg-warning/20 text-[#FDBA74] border border-warning/50 shadow-sm inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                <span>CHỜ THU TIỀN MẶT</span>
              </span>
            )
          ) : status === 'WAITING_CONFIRMATION' ? (
            <span className="pill-badge text-[11px] font-extrabold bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[0_0_14px_rgba(6,182,212,0.35)] inline-flex items-center gap-1.5 animate-pulse-badge-cyan">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span>ĐÃ CK • CHỜ XÁC NHẬN</span>
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

      {/* 1b. Dải Huy Hiệu Nhận Diện Nhanh: Phương Thức Thanh Toán & Phân Loại Đơn */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {paymentMethod === 'CASH' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#e0a96d]/15 text-[#e0a96d] border border-[#e0a96d]/35 shadow-sm">
            <Banknote className="w-3.5 h-3.5 text-[#e0a96d]" />
            <span>THU TIỀN MẶT</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#85C1DC]/15 text-[#85C1DC] border border-[#85C1DC]/35 shadow-sm">
            <QrCode className="w-3.5 h-3.5 text-[#85C1DC]" />
            <span>CHUYỂN KHOẢN QR</span>
          </span>
        )}

        {isCombo ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>🎁 COMBO MÓN + GIỜ</span>
          </span>
        ) : isPlaytimeOnly ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.25)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>⚡ NẠP GIỜ CHƠI</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>🍜 MÓN ĂN & UỐNG</span>
          </span>
        )}
      </div>

      {/* Khối Cảnh Báo Nếu Đơn Có Nạp Giờ */}
      {hasPlaytime && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/35 mb-3 text-xs shadow-inner">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-[11px]">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {order.sessionId
                ? 'Tự động gia hạn thời gian phiên chơi khi duyệt'
                : 'Cộng giờ vào tài khoản (khách tự đăng nhập PC)'}
            </span>
          </div>
          {paymentMethod === 'CASH' && status === 'PENDING_PAYMENT' && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-warning/25 text-warning border border-warning/50 shrink-0">
              Thu tiền trước!
            </span>
          )}
        </div>
      )}

      {/* 2. Vị trí Máy & Khách Hàng */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-midnight/60 border border-mist/15 mb-3 text-xs">
        {/* Máy tính & Khu vực Zone */}
        <div className="flex items-center gap-1.5 flex-wrap truncate">
          <Monitor className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="font-heading font-bold text-sand text-sm">
            {computerCode || 'Mang về'}
          </span>
          {computerZone && (
            <ZoneBadge zone={computerZone} size="sm" short={false} />
          )}
          {!order.sessionId && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              GỌI TẠI BÀN
            </span>
          )}
        </div>

        {/* Thời gian đặt */}
        <div className="flex items-center justify-end gap-1 text-[11px] text-mist font-mono">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{dayjs(createdAt).fromNow()}</span>
        </div>

        {/* Tên khách */}
        <div className="flex items-center gap-1.5 text-sand font-medium truncate col-span-2 pt-1 border-t border-mist/10">
          <User className="w-3.5 h-3.5 text-mist shrink-0" />
          <span className="truncate">{customerName || 'Khách vãng lai'}</span>
          <span className="text-[11px] text-mist font-mono">({customerPhone})</span>
        </div>
      </div>

      {/* 3. Danh Sách Món (Hiển thị 2 món đầu tiên với styling nhận diện) */}
      <div className="space-y-1.5 py-1 mb-3">
        {items.slice(0, 2).map((item) => {
          const isPlaytimeItem = item.itemType === 'PLAYTIME';
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-colors ${
                isPlaytimeItem
                  ? 'bg-cyan-950/40 text-cyan-300 font-bold border border-cyan-500/25'
                  : 'text-sand/90'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {isPlaytimeItem ? (
                  <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : item.itemImageUrl || item.imageUrl ? (
                  <img
                    src={item.itemImageUrl || item.imageUrl}
                    alt={item.itemName}
                    className="w-6 h-6 rounded-md object-cover border border-mist/20 shrink-0"
                  />
                ) : (
                  <Utensils className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                )}
                <span className="truncate">{item.itemName}</span>
              </div>
              <span className={`font-mono text-xs shrink-0 ${isPlaytimeItem ? 'text-cyan-400 font-bold' : 'text-mist'}`}>
                x{item.quantity}
              </span>
            </div>
          );
        })}

        {items.length > 2 && (
          <div className="text-[11px] text-gold font-medium italic">
            + và {items.length - 2} món khác...
          </div>
        )}
      </div>

      {/* 4. Tổng Tiền & Phương Thức Thanh Toán */}
      <div className="flex items-center justify-between pt-2.5 border-t border-mist/15 mb-3">
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

      {/* 5. Nút Thao Tác (Quick Actions: HỦY BÊN TRÁI, XÁC NHẬN BÊN PHẢI) */}
      {status === 'PENDING_PAYMENT' || status === 'WAITING_CONFIRMATION' ? (
        <div
          className="grid grid-cols-2 gap-2.5 pt-1"
          onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra thẻ cha
        >
          {/* NÚT 1: HỦY ĐƠN (BÊN TRÁI) */}
          <Button
            danger
            icon={<XCircle className="w-4 h-4" />}
            loading={isCancelling}
            disabled={isConfirming || isCancelling}
            onClick={() => onCancelOrder && onCancelOrder(order)}
            className="w-full rounded-full h-9 text-xs bg-danger/10 border border-danger/35 text-danger font-bold hover:bg-danger hover:text-white cursor-pointer transition-all"
          >
            Hủy đơn
          </Button>

          {/* NÚT 2: XÁC NHẬN / DUYỆT ĐƠN (BÊN PHẢI) */}
          {paymentMethod === 'QR' && status === 'PENDING_PAYMENT' ? (
            <Tooltip title="Khách chưa bấm 'Tôi đã chuyển khoản' — CẤM DUYỆT!">
              <span className="w-full">
                <Button
                  type="primary"
                  disabled
                  icon={<CheckCircle2 className="w-4 h-4 text-midnight/40" />}
                  className="w-full rounded-full h-9 text-xs bg-slate/40 text-mist/50 font-bold border-mist/20 opacity-40 cursor-not-allowed"
                >
                  Chờ khách CK
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                status === 'WAITING_CONFIRMATION'
                  ? 'Khách đã báo CK — Kiểm tra tài khoản ngân hàng trước khi bấm duyệt!'
                  : 'Đã thu đủ tiền mặt từ khách? Bấm để duyệt đơn.'
              }
            >
              <Button
                type="primary"
                icon={
                  status === 'WAITING_CONFIRMATION' ? (
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-midnight opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-midnight" />
                    </span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-midnight" />
                  )
                }
                loading={isConfirming}
                disabled={isConfirming || isCancelling}
                onClick={() => onConfirmOrder && onConfirmOrder(order)}
                className={`w-full rounded-full h-9 text-xs font-extrabold border-none cursor-pointer transition-all ${
                  status === 'WAITING_CONFIRMATION'
                    ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-midnight ring-2 ring-cyan-300/60 animate-pulse-button-cyan'
                    : 'bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight ring-1 ring-gold/50 animate-pulse-button-gold'
                }`}
              >
                {status === 'WAITING_CONFIRMATION' ? 'Xác nhận CK' : 'Xác nhận'}
              </Button>
            </Tooltip>
          )}
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
