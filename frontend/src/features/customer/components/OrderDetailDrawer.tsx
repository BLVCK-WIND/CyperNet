import React from 'react';
import { Drawer, Button, Tag, Divider } from 'antd';
import {
  ReceiptText,
  Clock,
  UserCheck,
  QrCode,
  Coins,
  Monitor,
  Utensils,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { OrderResponse } from '@/types/order';

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
  onOpenQr: (order: OrderResponse) => void;
  isLoadingQr?: boolean;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onOpenQr,
  isLoadingQr = false,
}) => {
  if (!order) return null;

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.totalAmount);

  const canShowQr =
    order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'QR';

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      placement="right"
      size={380}
      title={
        <div className="flex items-center gap-2 text-sand">
          <ReceiptText className="w-5 h-5 text-gold" />
          <span className="font-['Space_Grotesk'] text-base font-bold">
            Chi Tiết Đơn #{order.id}
          </span>
        </div>
      }
      styles={{
        header: {
          backgroundColor: '#10232A',
          borderBottom: '1px solid rgba(167, 158, 156, 0.15)',
        },
        body: {
          backgroundColor: '#10232A',
          color: '#D3C3B9',
          padding: 16,
        },
        footer: {
          backgroundColor: '#10232A',
          borderTop: '1px solid rgba(167, 158, 156, 0.15)',
          padding: 16,
        },
      }}
      footer={
        canShowQr ? (
          <Button
            type="primary"
            size="large"
            loading={isLoadingQr}
            disabled={isLoadingQr}
            icon={<QrCode className="w-4 h-4 text-midnight" />}
            onClick={() => onOpenQr(order)}
            className="w-full h-12 text-sm font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
          >
            MỞ MÃ QR THANH TOÁN
          </Button>
        ) : null
      }
    >
      <div className="space-y-4 text-xs">
        {/* Status & Machine Info */}
        <div className="p-3.5 rounded-xl bg-slate/50 border border-mist/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-mist">Trạng thái đơn:</span>
            {order.status === 'PENDING_PAYMENT' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-amber-400 text-midnight shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-midnight shrink-0" />
                CHỜ THANH TOÁN / DUYỆT
              </span>
            )}
            {order.status === 'CONFIRMED' && (
              <Tag color="#4CAF50" className="m-0 font-bold border-0">
                ĐÃ HOÀN THÀNH
              </Tag>
            )}
            {order.status === 'CANCELLED' && (
              <Tag color="#EF5350" className="m-0 font-bold border-0">
                ĐÃ HỦY
              </Tag>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-gold" />
              Máy trạm:
            </span>
            <span className="font-semibold text-sand">{order.computerCode}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Thời gian tạo:
            </span>
            <span className="font-mono text-sand">
              {dayjs(order.createdAt).format('HH:mm:ss DD/MM/YYYY')}
            </span>
          </div>

          {order.confirmedAt && (
            <div className="flex items-center justify-between border-t border-mist/10 pt-2">
              <span className="text-mist flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Duyệt bởi:
              </span>
              <span className="text-sand font-medium">
                {order.confirmedByStaffName || 'Thu ngân'}
              </span>
            </div>
          )}
        </div>

        {/* Item List */}
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-mist block mb-2">
            Danh sách món ăn & dịch vụ ({order.items?.length || 0})
          </span>

          <div className="space-y-2">
            {order.items?.map((item) => {
              const formattedUnitPrice = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(item.unitPrice);

              const formattedSubtotal = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(item.subtotal);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate/40 border border-mist/10 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-midnight/80 border border-mist/20 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.itemImageUrl || item.imageUrl ? (
                        <img
                          src={item.itemImageUrl || item.imageUrl}
                          alt={item.itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Utensils className="w-4 h-4 text-gold/70" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-sand text-xs m-0 truncate">
                        {item.itemName}
                      </h5>
                      <span className="text-[11px] text-mist">
                        {formattedUnitPrice} × {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-sand font-mono text-xs shrink-0">
                    {formattedSubtotal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Divider className="border-mist/15 my-3" />

        {/* Payment Summary */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-mist">
            <span>Phương thức thanh toán:</span>
            <span className="text-sand font-semibold flex items-center gap-1">
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
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-mist/10 text-sand">
            <span className="font-semibold">Tổng thanh toán:</span>
            <span className="text-lg font-bold text-gold font-['Space_Grotesk']">
              {formattedTotal}
            </span>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default OrderDetailDrawer;
