import React, { useState } from 'react';
import { Modal, Button, Tag, message } from 'antd';
import {
  ShieldCheck,
  Coins,
  AlertTriangle,
  ReceiptText,
  User,
  Monitor,
  Clock,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import type { OrderResponse } from '@/types/order';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import dayjs from 'dayjs';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  order: OrderResponse | null;
  actionType: 'confirm' | 'cancel';
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: (orderId: number, computerCode?: string) => Promise<void>;
  onCancelOrder: (orderId: number) => Promise<void>;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  isOpen,
  order,
  actionType,
  isProcessing,
  onClose,
  onConfirm,
  onCancelOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const isQr = order.paymentMethod === 'QR';
  const hasPlaytime = order.items?.some((it) => it.itemType === 'PLAYTIME');
  const isCancel = actionType === 'cancel';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const copyTransferContent = () => {
    const text = `ORDER-CYBERNET-${order.id}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    message.success('Đã sao chép nội dung chuyển khoản!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = async () => {
    if (isCancel) {
      await onCancelOrder(order.id);
    } else {
      await onConfirm(order.id, order.computerCode);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={580}
      closable={!isProcessing}
      closeIcon={<X className="w-5 h-5 text-mist hover:text-sand transition-colors" />}
      styles={{
        body: {
          backgroundColor: '#1b1e2b',
          borderRadius: '20px',
          border: '1px solid rgba(139, 154, 159, 0.25)',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(189, 152, 117, 0.1)',
        },
        mask: {
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(10, 12, 18, 0.75)',
        },
      }}
    >
      <div className="flex flex-col select-none text-sand">
        {/* 1. Header Banner */}
        <div
          className={`p-6 border-b border-mist/15 relative overflow-hidden ${
            isCancel
              ? 'bg-gradient-to-r from-danger/20 via-danger/10 to-transparent'
              : isQr
              ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent'
              : 'bg-gradient-to-r from-gold/25 via-gold/10 to-transparent'
          }`}
        >
          <div className="flex items-start gap-4">
            {/* Glowing Icon Badge */}
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                isCancel
                  ? 'bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-rose-900/40'
                  : isQr
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-midnight shadow-cyan-500/30'
                  : 'bg-gradient-to-br from-gold to-gold-dark text-midnight shadow-gold/30'
              }`}
            >
              {isCancel ? (
                <AlertTriangle className="w-6 h-6" />
              ) : isQr ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <Coins className="w-7 h-7" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Tag
                  bordered={false}
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded m-0 ${
                    isCancel
                      ? 'bg-danger/20 text-danger border border-danger/30'
                      : isQr
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'bg-gold/20 text-gold border border-gold/40'
                  }`}
                >
                  #ORD-{order.id}
                </Tag>
                <Tag
                  bordered={false}
                  className="bg-midnight/80 text-mist text-xs px-2 py-0.5 rounded border border-mist/20 m-0"
                >
                  {isQr ? 'Chuyển khoản VietQR' : 'Tiền mặt tại bàn'}
                </Tag>
              </div>

              <h2 className="text-lg font-bold text-sand font-heading tracking-wide leading-tight">
                {isCancel
                  ? `Xác nhận hủy đơn hàng #ORD-${order.id}?`
                  : isQr
                  ? 'Đối soát & Xác nhận chuyển khoản VietQR'
                  : hasPlaytime
                  ? 'Xác nhận thu tiền mặt & Nạp giờ chơi'
                  : 'Xác nhận đã nhận đủ tiền mặt từ khách'}
              </h2>

              <p className="text-xs text-mist mt-1 leading-relaxed">
                {isCancel
                  ? 'Đơn hàng sau khi hủy sẽ không thể phục hồi lại trong ca trực.'
                  : isQr
                  ? 'Vui lòng kiểm tra biến động số dư tài khoản ngân hàng của quán trước khi duyệt.'
                  : 'Vui lòng kiểm tra và đảm bảo đã cầm đủ tiền mặt trên tay từ khách hàng.'}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Modal Body Content */}
        <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto custom-twinkle-scrollbar">
          {/* Thông tin đối tượng & Máy trạm */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-midnight/70 border border-mist/15 space-y-1">
              <span className="text-[11px] text-mist flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-sand/70" />
                Khách hàng
              </span>
              <div className="font-bold text-sand text-sm truncate">
                {order.customerName || 'Khách vãng lai'}
              </div>
              <div className="text-xs font-mono text-cyan-300 font-semibold">
                {order.customerPhone || 'Chưa có SĐT'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-midnight/70 border border-mist/15 space-y-1">
              <span className="text-[11px] text-mist flex items-center gap-1.5 font-medium">
                <Monitor className="w-3.5 h-3.5 text-gold" />
                Vị trí máy & Khu vực
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gold font-mono text-base tracking-wide">
                  {order.computerCode || 'Tại quầy POS'}
                </span>
                {order.computerZone && (
                  <ZoneBadge zone={order.computerZone} size="sm" short={false} />
                )}
              </div>
              <div className="text-[11px] text-mist flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-mist/60" />
                {dayjs(order.createdAt).format('HH:mm:ss • DD/MM')}
              </div>
            </div>
          </div>

          {/* Banner Số tiền thanh toán */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isCancel
                ? 'bg-midnight/80 border-mist/20'
                : isQr
                ? 'bg-cyan-950/30 border-cyan-500/35 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                : 'bg-gold/10 border-gold/35 shadow-[0_0_20px_rgba(189,152,117,0.1)]'
            }`}
          >
            <div>
              <span className="text-xs text-mist font-medium block">
                {isCancel ? 'Giá trị đơn hủy' : isQr ? 'Số tiền cần đối soát trong App' : 'Tổng tiền mặt cần thu'}
              </span>
              <span
                className={`text-2xl font-black font-['Space_Grotesk'] tracking-wide ${
                  isCancel ? 'text-sand/80' : isQr ? 'text-cyan-300' : 'text-gold'
                }`}
              >
                {formatCurrency(order.totalAmount)}
              </span>
            </div>

            {isQr && !isCancel && (
              <div className="text-right">
                <span className="text-[11px] text-mist block mb-1">Nội dung CK chuẩn:</span>
                <button
                  type="button"
                  onClick={copyTransferContent}
                  className="px-2.5 py-1 rounded-lg bg-midnight/90 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:border-cyan-400"
                  title="Bấm để sao chép"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>ORDER-CYBERNET-{order.id}</span>
                </button>
              </div>
            )}
          </div>

          {/* Chi tiết danh sách món đặt */}
          <div className="p-3.5 rounded-xl bg-midnight/50 border border-mist/15 space-y-2">
            <div className="flex items-center justify-between text-xs text-mist border-b border-mist/10 pb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <ReceiptText className="w-3.5 h-3.5 text-sand/70" />
                Chi tiết giỏ hàng ({order.items?.length || 0} món)
              </span>
              <span>Thành tiền</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs custom-twinkle-scrollbar">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-sand">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-5 h-5 rounded bg-slate/50 text-gold font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                      {item.quantity}x
                    </span>
                    <span className="truncate">{item.itemName}</span>
                    {item.itemType === 'PLAYTIME' && (
                      <Tag bordered={false} className="m-0 text-[10px] px-1 py-0 bg-gold/20 text-gold border-0">
                        Nạp giờ
                      </Tag>
                    )}
                  </div>
                  <span className="font-mono text-sand font-semibold shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cảnh báo An toàn Tài chính */}
          {isCancel ? (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-xs text-rose-300 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-danger">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Cảnh báo hủy đơn:
              </div>
              <p className="text-[11px] text-rose-200/90 pl-5.5">
                Đơn hàng sẽ chuyển trạng thái <strong>CANCELLED</strong>. Nếu khách hàng đã thanh toán trước đó, nhân viên vui lòng tiến hành hoàn tiền mặt cho khách tại quầy.
              </p>
            </div>
          ) : isQr ? (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/35 text-xs text-cyan-200 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                Rào chắn an toàn tài chính VietQR:
              </div>
              <p className="text-[11px] text-cyan-200/80 pl-5.5">
                Vui lòng mở ứng dụng ngân hàng / thông báo biến động số dư của quán và đối soát chính xác số tiền{' '}
                <strong className="text-gold font-mono">{formatCurrency(order.totalAmount)}</strong> kèm nội dung{' '}
                <strong className="text-cyan-300 font-mono">ORDER-CYBERNET-{order.id}</strong> trước khi duyệt.
                {hasPlaytime && !order.sessionId && (
                  <span className="block mt-1 text-cyan-100 font-semibold">
                    * Lưu ý: Máy chưa mở phiên. Giờ chơi sẽ được nạp vào tài khoản khách (khách tự đăng nhập PC để mở máy).
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                Quy định thu tiền mặt:
              </div>
              <p className="text-[11px] text-amber-200/90 pl-5.5">
                Vui lòng đảm bảo bạn đã cầm đủ{' '}
                <strong className="text-gold font-mono">{formatCurrency(order.totalAmount)}</strong> tiền mặt trên tay từ khách hàng.
                {hasPlaytime &&
                  (order.sessionId
                    ? ' Hệ thống sẽ tự động gia hạn thời gian máy trạm ngay khi duyệt.'
                    : ' Giờ chơi sẽ được cộng an toàn vào tài khoản khách (khách tự đăng nhập PC để mở máy).')}
              </p>
            </div>
          )}
        </div>

        {/* 3. Action Buttons Footer (Rộng rãi, 2 cột ngang đối xứng, không bao giờ bị chèn ép) */}
        <div className="p-5 border-t border-mist/15 bg-midnight/90 grid grid-cols-2 gap-3.5">
          <Button
            size="large"
            disabled={isProcessing}
            onClick={onClose}
            className="h-12 rounded-xl text-sm font-semibold bg-slate/40 hover:bg-slate/70 text-sand border border-mist/20 hover:border-mist/40 transition-all cursor-pointer flex items-center justify-center"
          >
            {isCancel ? 'Không hủy / Quay lại' : 'Chưa thu / Kiểm tra lại'}
          </Button>

          <Button
            type="primary"
            size="large"
            loading={isProcessing}
            disabled={isProcessing}
            onClick={handleAction}
            className={`h-12 rounded-xl text-sm font-bold border-none transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isCancel
                ? 'bg-danger hover:bg-danger/90 text-white shadow-[0_0_16px_rgba(239,83,80,0.35)]'
                : isQr
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-midnight shadow-[0_0_18px_rgba(6,182,212,0.45)]'
                : 'bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight shadow-[0_4px_18px_rgba(189,152,117,0.35)]'
            }`}
          >
            {isCancel ? (
              'Xác nhận hủy đơn'
            ) : isQr ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Đã nhận đủ tiền • Duyệt đơn</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Đã thu đủ tiền • Duyệt đơn</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
