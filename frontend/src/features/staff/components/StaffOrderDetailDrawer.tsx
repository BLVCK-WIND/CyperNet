import React from 'react';
import { Drawer, Button, Tag } from 'antd';
import {
  ReceiptText,
  User,
  Monitor,
  Phone,
  CheckCircle2,
  XCircle,
  QrCode,
  Banknote,
  Utensils,
  ShieldCheck,
  X,
} from 'lucide-react';
import dayjs from 'dayjs';
import { GlassCard } from '@/components/ui/GlassCard';
import type { OrderResponse } from '@/types/order';

interface StaffOrderDetailDrawerProps {
  open: boolean;
  order: OrderResponse | null;
  onClose: () => void;
  onConfirmOrder?: (order: OrderResponse) => void;
  onCancelOrder?: (order: OrderResponse) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}

export const StaffOrderDetailDrawer: React.FC<StaffOrderDetailDrawerProps> = ({
  open,
  order,
  onClose,
  onConfirmOrder,
  onCancelOrder,
  isConfirming = false,
  isCancelling = false,
}) => {
  if (!order) return null;

  const {
    id,
    computerCode,
    customerName,
    customerPhone,
    totalAmount,
    paymentMethod,
    status,
    createdAt,
    confirmedAt,
    confirmedByStaffName,
    items,
  } = order;

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={false}
      size={440}
      styles={{
        body: {
          padding: 0,
          backgroundColor: '#10232A',
          color: '#D3C3B9',
          overflowX: 'hidden',
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <div className="flex flex-col h-full bg-midnight select-none">
        {/* 1. Header */}
        <div className="flex items-center justify-between p-5 border-b border-[rgba(167,158,156,0.15)] bg-[rgba(16,35,42,0.8)] sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-midnight flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(181,136,99,0.3)]">
              <ReceiptText className="w-5 h-5 text-midnight" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-xl text-sand tracking-wide">
                  #ORD-{id}
                </h2>
                {status === 'PENDING_PAYMENT' ? (
                  <Tag bordered={false} className="m-0 text-xs font-bold px-2 py-0.5 rounded bg-warning/20 text-warning border border-warning/40">
                    Chờ thanh toán
                  </Tag>
                ) : status === 'CONFIRMED' ? (
                  <Tag bordered={false} className="m-0 text-xs font-bold px-2 py-0.5 rounded bg-success/20 text-success border border-success/40">
                    Đã duyệt
                  </Tag>
                ) : (
                  <Tag bordered={false} className="m-0 text-xs font-bold px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/40">
                    Đã hủy
                  </Tag>
                )}
              </div>
              <span className="text-xs text-mist font-mono">
                {dayjs(createdAt).format('HH:mm:ss • DD/MM/YYYY')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-mist hover:text-sand hover:bg-[rgba(61,77,85,0.4)] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Content */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* Thông tin Khách & Máy */}
          <GlassCard className="p-4 rounded-2xl border border-[rgba(167,158,156,0.15)] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-mist flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-gold" />
                Vị trí máy trạm:
              </span>
              <span className="font-heading font-bold text-sand text-sm">
                {computerCode || 'Tại quầy / Mang về'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-mist flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-mist" />
                Khách hàng:
              </span>
              <span className="font-bold text-sand">
                {customerName || 'Khách vãng lai'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-mist flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-mist" />
                Số điện thoại:
              </span>
              <span className="font-mono text-sand">{customerPhone}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[rgba(167,158,156,0.1)]">
              <span className="text-mist">Thanh toán:</span>
              <span className="font-medium text-sand inline-flex items-center gap-1">
                {paymentMethod === 'QR' ? (
                  <>
                    <QrCode className="w-3.5 h-3.5 text-[#85C1DC]" />
                    Chuyển khoản VietQR
                  </>
                ) : (
                  <>
                    <Banknote className="w-3.5 h-3.5 text-success" />
                    Tiền mặt tại quầy
                  </>
                )}
              </span>
            </div>
          </GlassCard>

          {/* Chi tiết từng món gọi */}
          <div>
            <h3 className="text-xs font-bold text-sand uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-gold" />
              Danh Sách Món Ăn ({items.length} món)
            </h3>

            <div className="space-y-2">
              {items.map((item) => {
                const itemSubtotal = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(item.subtotal);

                const itemUnit = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(item.unitPrice);

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[rgba(61,77,85,0.35)] border border-[rgba(167,158,156,0.1)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {item.itemImageUrl || item.imageUrl ? (
                        <img
                          src={item.itemImageUrl || item.imageUrl}
                          alt={item.itemName}
                          className="w-10 h-10 rounded-lg object-cover border border-[rgba(167,158,156,0.2)] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[rgba(16,35,42,0.6)] flex items-center justify-center text-mist shrink-0 border border-[rgba(167,158,156,0.1)]">
                          <Utensils className="w-4 h-4" />
                        </div>
                      )}

                      <div className="truncate">
                        <span className="font-semibold text-sand block truncate">
                          {item.itemName}
                        </span>
                        <span className="text-[11px] text-mist font-mono">
                          {itemUnit} × {item.quantity}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-sand shrink-0">
                      {itemSubtotal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tóm tắt tổng tiền */}
          <GlassCard className="p-4 rounded-xl border border-[rgba(181,136,99,0.25)] bg-[rgba(181,136,99,0.06)] flex items-center justify-between">
            <span className="text-xs font-semibold text-sand">TỔNG CỘNG HÓA ĐƠN</span>
            <span className="font-heading font-extrabold text-xl text-gold font-mono">
              {formattedTotal}
            </span>
          </GlassCard>

          {/* Thông tin nhân viên duyệt (nếu đã CONFIRMED) */}
          {status === 'CONFIRMED' && confirmedByStaffName && (
            <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-success font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Đơn hàng đã được xác nhận
              </div>
              <p className="text-mist text-[11px]">
                Nhân viên duyệt: <strong className="text-sand">{confirmedByStaffName}</strong>
                {confirmedAt && (
                  <span> • {dayjs(confirmedAt).format('HH:mm DD/MM')}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 3. Action Buttons (nếu đơn đang PENDING_PAYMENT) */}
        {status === 'PENDING_PAYMENT' && (
          <div className="p-4 border-t border-[rgba(167,158,156,0.12)] bg-[rgba(16,35,42,0.9)] grid grid-cols-2 gap-3">
            <Button
              danger
              icon={<XCircle className="w-4 h-4" />}
              loading={isCancelling}
              disabled={isConfirming || isCancelling}
              onClick={() => {
                if (onCancelOrder) onCancelOrder(order);
              }}
              className="h-11 rounded-xl text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger hover:text-white cursor-pointer"
            >
              Hủy đơn
            </Button>

            <Button
              type="primary"
              icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
              loading={isConfirming}
              disabled={isConfirming || isCancelling}
              onClick={() => {
                if (onConfirmOrder) onConfirmOrder(order);
              }}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer"
            >
              Xác nhận đơn
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};
