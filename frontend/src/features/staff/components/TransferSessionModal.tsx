import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Tag, Checkbox, Input, App } from 'antd';
import {
  ArrowRightLeft,
  Monitor,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { sessionApi } from '@/api/sessionApi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { FloorMapComputerItem } from '@/types/computer';
import type { ErrorResponse, SessionResponse } from '@/types/auth';

interface TransferSessionModalProps {
  open: boolean;
  computer: FloorMapComputerItem | null;
  availableComputers: FloorMapComputerItem[];
  onClose: () => void;
  onSuccess: (session: SessionResponse) => void;
}

export const TransferSessionModal: React.FC<TransferSessionModalProps> = ({
  open,
  computer,
  availableComputers,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [targetComputerId, setTargetComputerId] = useState<number | null>(null);
  const [markOldAsMaintenance, setMarkOldAsMaintenance] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chỉ khởi tạo state khi modal mở lên (open = true)
  useEffect(() => {
    if (open) {
      setTargetComputerId(
        availableComputers.length > 0 ? availableComputers[0].id : null
      );
      setMarkOldAsMaintenance(false);
      setReason('');
    }
  }, [open, computer?.id]);

  if (!computer || !computer.activeSession) return null;

  const session = computer.activeSession;
  const targetComputer = availableComputers.find((c) => c.id === targetComputerId);

  const handleConfirmTransfer = async () => {
    if (!targetComputerId) {
      message.warning('Vui lòng chọn máy trạm chuyển đến!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sessionApi.transferSession(session.id, {
        toComputerId: targetComputerId,
        markOldAsMaintenance,
        reason: reason.trim() || undefined,
      });

      message.success(
        `Đã chuyển phiên chơi của khách ${session.accountName || 'hàng'} sang máy ${res.computerCode} thành công!`
      );
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ErrorResponse;
      if (apiErr.errorCode === 'COMPUTER_NOT_AVAILABLE') {
        message.error('Máy tính đích hiện không còn khả dụng để chuyển đến!');
      } else if (apiErr.errorCode === 'SESSION_NOT_ACTIVE') {
        message.error('Phiên chơi này đã kết thúc trước đó!');
        onClose();
      } else {
        message.error(apiErr.message || 'Chuyển máy thất bại. Vui lòng thử lại!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      maskClosable={false}
      width={520}
      styles={{
        body: {
          backgroundColor: '#202332',
          padding: 0,
          borderRadius: 16,
        },
        mask: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <div className="p-6 space-y-5 text-sand select-none">
        {/* 1. Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-mist/15">
          <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(189,152,117,0.25)]">
            <ArrowRightLeft className="w-5 h-5 text-gold" />
          </div>

          <div>
            <h2 className="font-heading font-extrabold text-lg text-sand tracking-wide flex items-center gap-2">
              Chuyển Máy Trạm (Transfer)
            </h2>
            <p className="text-xs text-mist">
              Chuyển phiên chơi hiện tại sang máy trạm mới mà không gián đoạn giờ chơi.
            </p>
          </div>
        </div>

        {/* 2. Sơ đồ chuyển đổi máy: Nguồn -> Đích */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* Máy Nguồn (Hiện tại) */}
          <GlassCard className="p-3 rounded-xl border border-info/30 bg-slate/40">
            <span className="text-[10px] text-mist uppercase font-semibold block mb-1">
              Máy nguồn (Hiện tại)
            </span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sand text-base">
                {computer.code}
              </span>
              <Tag bordered={false} className="m-0 text-[10px] font-bold bg-info/20 text-[#85C1DC]">
                {computer.zone}
              </Tag>
            </div>
            <span className="text-xs text-mist truncate block mt-1">
              Khách: {session.accountName || 'Khách vãng lai'}
            </span>
          </GlassCard>

          {/* Máy Đích (Mới) */}
          <GlassCard className="p-3 rounded-xl border border-gold/40 bg-gold/10">
            <span className="text-[10px] text-gold uppercase font-semibold block mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Máy chuyển đến
            </span>
            {targetComputer ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-gold text-base">
                    {targetComputer.code}
                  </span>
                  <Tag bordered={false} className="m-0 text-[10px] font-bold bg-gold/20 text-gold">
                    {targetComputer.zone}
                  </Tag>
                </div>
                <span className="text-xs text-sand font-mono block mt-1">
                  {new Intl.NumberFormat('vi-VN').format(targetComputer.pricePerHour)}đ/h
                </span>
              </div>
            ) : (
              <span className="text-xs text-mist italic">Chưa chọn máy đích</span>
            )}
          </GlassCard>
        </div>

        {/* 3. Chọn máy đích khả dụng */}
        <div>
          <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-gold" />
            Chọn máy trạm sẵn sàng ({availableComputers.length} máy trống)
          </label>

          {availableComputers.length === 0 ? (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger text-center">
              Hiện không còn máy trạm nào ở trạng thái sẵn sàng để chuyển đến!
            </div>
          ) : (
            <Select
              className="w-full h-11"
              value={targetComputerId}
              onChange={(val) => setTargetComputerId(val)}
              options={availableComputers.map((c) => ({
                value: c.id,
                label: `${c.code} (${c.zone}) • ${new Intl.NumberFormat('vi-VN').format(c.pricePerHour)}đ/h (IP: ${c.ipAddress})`,
              }))}
            />
          )}
        </div>

        {/* 4. Tùy chọn đưa máy cũ vào bảo trì */}
        <div className="p-3 rounded-xl bg-midnight/70 border border-mist/20">
          <Checkbox
            checked={markOldAsMaintenance}
            onChange={(e) => setMarkOldAsMaintenance(e.target.checked)}
            className="text-xs text-sand select-none"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Wrench className="w-3.5 h-3.5 text-danger" />
              Đánh dấu máy cũ ({computer.code}) vào chế độ bảo trì sau khi chuyển
            </span>
          </Checkbox>
          <p className="text-[11px] text-mist/70 ml-6 mt-1">
            Chọn nếu khách đổi máy vì máy cũ gặp sự cố phần cứng (đơ chuột, phím hỏng, lỗi màn hình).
          </p>
        </div>

        {/* 5. Ghi chú lý do chuyển */}
        <div>
          <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2">
            Lý do chuyển máy (Tùy chọn)
          </label>
          <Input
            placeholder="Ví dụ: Khách đổi lên máy VIP, chuột máy cũ bị chập..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={100}
            className="bg-midnight/70 border-mist/20 text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-10"
          />
        </div>

        {/* 6. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-mist/15">
          <Button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl h-10 text-xs px-5 bg-transparent border-mist/20 text-sand hover:text-mist"
          >
            Hủy bỏ
          </Button>

          <Button
            type="primary"
            onClick={handleConfirmTransfer}
            loading={submitting}
            disabled={!targetComputerId || availableComputers.length === 0}
            icon={!submitting && <ArrowRightLeft className="w-3.5 h-3.5" />}
            className="rounded-xl h-10 text-xs px-6 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'ĐANG CHUYỂN MÁY...' : 'XÁC NHẬN CHUYỂN MÁY'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
