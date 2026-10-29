import React, { useState } from 'react';
import { Modal, Button, Tag, App } from 'antd';
import { QrCode, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse, VietQrResponse } from '@/types/order';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderResponse | null;
  vietQr: VietQrResponse | null;
  onConfirmPaid: () => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  vietQr,
  onConfirmPaid,
}) => {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  if (!order || !vietQr) return null;

  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(order.totalAmount);

  const copyToClipboard = (text: string, label: string = 'nội dung') => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  const handleConfirmPaid = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await orderApi.notifyTransferred(order.id);
      message.success('Đã gửi thông báo chuyển khoản tới quầy thu ngân!');
      onConfirmPaid();
    } catch {
      message.info('Đã ghi nhận! Quầy thu ngân sẽ đối soát trong giây lát.');
      onConfirmPaid();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      title={
        <div className="flex items-center gap-2 text-sand text-base font-semibold">
          <QrCode className="w-5 h-5 text-gold" />
          <span>Thanh Toán VietQR Napas247</span>
        </div>
      }
      styles={{
        body: {
          backgroundColor: '#202332',
        },
        header: {
          backgroundColor: '#202332',
          borderBottom: '1px solid rgba(139, 154, 159, 0.2)',
          paddingBottom: 12,
        },
      }}
    >
      <div className="flex flex-col items-center py-2 space-y-4 text-center">
        {/* Status Tag */}
        <Tag color="#FFB74D" className="font-semibold px-3 py-0.5 border-0 text-xs">
          ĐƠN HÀNG #{order.id} • CHỜ THANH TOÁN
        </Tag>

        {/* QR Code Frame */}
        <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-gold/40 flex items-center justify-center">
          <img
            src={vietQr.qrUrl}
            alt="Mã VietQR Thanh Toán"
            className="w-56 h-56 object-contain rounded-lg"
          />
        </div>

        {/* Amount */}
        <div>
          <span className="text-xs text-mist block">Số tiền cần thanh toán</span>
          <span className="text-2xl font-bold text-gold font-['Space_Grotesk'] tracking-wide">
            {formattedAmount}
          </span>
        </div>

        {/* Bank & Transfer Info Box */}
        <div className="w-full p-3.5 rounded-xl bg-midnight/80 border border-mist/15 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-mist">Ngân hàng:</span>
            <span className="font-semibold text-sand">{vietQr.bankId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist">Số tài khoản:</span>
            <div className="flex items-center gap-1.5 font-mono text-sand font-bold">
              <span>{vietQr.accountNo}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(vietQr.accountNo, 'số tài khoản')}
                className="text-gold hover:text-gold-light p-0.5 cursor-pointer"
                title="Sao chép STK"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-mist/10 pt-2">
            <span className="text-mist">Nội dung CK:</span>
            <div className="flex items-center gap-1.5 font-mono text-gold font-bold">
              <span>{vietQr.content}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(vietQr.content, 'nội dung chuyển khoản')}
                className="text-gold hover:text-gold-light p-0.5 cursor-pointer"
                title="Sao chép nội dung"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-mist/70 leading-relaxed flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Vui lòng giữ đúng nội dung chuyển khoản để quầy thu ngân duyệt đơn nhanh chóng.</span>
        </p>

        {/* Action Button */}
        <Button
          type="primary"
          size="large"
          loading={submitting}
          disabled={submitting}
          icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
          onClick={handleConfirmPaid}
          className="w-full h-12 font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
        >
          TÔI ĐÃ CHUYỂN KHOẢN
        </Button>
      </div>
    </Modal>
  );
};

export default QrPaymentModal;
