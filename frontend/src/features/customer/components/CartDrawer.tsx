import React, { useState } from 'react';
import { Drawer, Button, App, Divider } from 'antd';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Coins,
  QrCode,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse, VietQrResponse } from '@/types/order';
import type { ErrorResponse } from '@/types/auth';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: OrderResponse, vietQr: VietQrResponse | null) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { message } = App.useApp();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    getTotalAmount,
    getTotalCount,
  } = useCartStore();

  const { sessionId } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const totalAmount = getTotalAmount();
  const totalCount = getTotalCount();

  const formattedTotal = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(totalAmount);

  const handleCheckout = async () => {
    if (items.length === 0) {
      message.warning('Giỏ hàng của bạn đang trống!');
      return;
    }

    if (!sessionId) {
      message.error('Không tìm thấy thông tin phiên chơi. Vui lòng đăng nhập lại!');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Gửi request tạo đơn hàng
      const order = await orderApi.createOrder({
        sessionId,
        paymentMethod,
        items: items.map((i) => ({
          itemId: i.item.id,
          quantity: i.quantity,
        })),
      });

      // 2. Nếu thanh toán VietQR, tạo mã QR động ngay lập tức
      let vietQrData: VietQrResponse | null = null;
      if (paymentMethod === 'QR') {
        try {
          vietQrData = await orderApi.generateVietQR(
            order.totalAmount,
            `ORDER-CYBERNET-${order.id}`
          );
        } catch {
          message.warning('Không thể tạo mã VietQR tự động. Vui lòng thanh toán tại quầy!');
        }
      }

      // 3. Dọn sạch giỏ hàng & kích hoạt callback
      clearCart();
      onClose();
      onOrderSuccess(order, vietQrData);
    } catch (err: unknown) {
      const error = err as ErrorResponse;
      if (error?.errorCode === 'ORDER_OUT_OF_STOCK') {
        message.error(error.message || 'Một số món trong giỏ hàng hiện đã hết hàng!');
      } else if (error?.errorCode === 'SESSION_NOT_ACTIVE') {
        message.error('Phiên chơi của bạn đã kết thúc, không thể đặt món!');
      } else {
        message.error(error?.message || 'Tạo đơn đặt món thất bại. Vui lòng thử lại!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      placement="right"
      size={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 390}
      title={
        <div className="flex items-center justify-between text-sand">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <span className="font-['Space_Grotesk'] text-base font-bold">
              Giỏ Hàng ({totalCount})
            </span>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              disabled={submitting}
              onClick={clearCart}
              className="text-xs text-mist hover:text-danger disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
      }
      styles={{
        header: {
          backgroundColor: '#202332',
          borderBottom: '1px solid rgba(139, 154, 159, 0.2)',
        },
        body: {
          backgroundColor: '#202332',
          color: '#f0ebe5',
          padding: 16,
        },
        footer: {
          backgroundColor: '#202332',
          borderTop: '1px solid rgba(139, 154, 159, 0.2)',
          padding: 16,
        },
      }}
      footer={
        items.length > 0 ? (
          <div className="space-y-3.5">
            {/* Payment Method Selector */}
            <div>
              <span className="text-xs text-mist uppercase tracking-wider font-semibold block mb-2">
                Phương thức thanh toán
              </span>
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPaymentMethod('CASH')}
                  className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'CASH'
                      ? 'bg-gold/15 border-gold text-gold shadow-sm shadow-gold/20'
                      : 'bg-slate/50 border-mist/20 text-sand hover:border-gold/40'
                  }`}
                >
                  <Coins className={`w-4 h-4 shrink-0 ${paymentMethod === 'CASH' ? 'text-gold' : 'text-mist'}`} />
                  <span>Tiền mặt</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPaymentMethod('QR')}
                  className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'QR'
                      ? 'bg-gold/15 border-gold text-gold shadow-sm shadow-gold/20'
                      : 'bg-slate/50 border-mist/20 text-sand hover:border-gold/40'
                  }`}
                >
                  <QrCode className={`w-4 h-4 shrink-0 ${paymentMethod === 'QR' ? 'text-gold' : 'text-mist'}`} />
                  <span>VietQR</span>
                </button>
              </div>
            </div>

            <Divider className="border-mist/15 my-2" />

            {/* Total Amount Summary */}
            <div className="flex items-center justify-between text-sand">
              <span className="text-sm font-medium text-mist">Tổng cộng:</span>
              <span className="text-xl font-bold text-gold font-['Space_Grotesk']">
                {formattedTotal}
              </span>
            </div>

            {/* Checkout CTA Button */}
            <Button
              type="primary"
              size="large"
              loading={submitting}
              disabled={submitting || items.length === 0}
              onClick={handleCheckout}
              className="w-full h-12 text-sm font-bold bg-gold hover:bg-gold-light active:bg-gold-dark text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
            >
              <span>XÁC NHẬN ĐẶT MÓN</span>
              <ArrowRight className="w-4 h-4 text-midnight" />
            </Button>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate/50 text-mist flex items-center justify-center mb-3 border border-mist/20">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-sand mb-1">
            Giỏ hàng của bạn đang trống
          </h4>
          <p className="text-xs text-mist max-w-xs">
            Hãy chọn các món ăn, nước uống yêu thích từ thực đơn để nạp năng lượng!
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {items.map(({ item, quantity }) => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(item.price * quantity);

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate/50 border border-mist/15 flex items-center justify-between gap-3"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-midnight/80 border border-mist/20 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5 text-gold/70" />
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-sand truncate">
                    {item.name}
                  </h4>
                  <span className="text-xs font-bold text-gold font-['Space_Grotesk'] block mt-0.5">
                    {formattedPrice}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-lg bg-midnight/80 border border-mist/20 p-0.5">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded flex items-center justify-center text-mist hover:text-gold hover:bg-slate/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-8 text-center text-xs font-bold text-sand font-mono">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded flex items-center justify-center text-mist hover:text-gold hover:bg-slate/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-mist/60 hover:text-danger disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    aria-label={`Xóa ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default CartDrawer;
