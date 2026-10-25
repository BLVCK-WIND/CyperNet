import React, { useState } from 'react';
import { Modal, Button, Tag, App } from 'antd';
import {
  Square,
  Monitor,
  User,
  Clock,
  RotateCcw,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import dayjs from 'dayjs';
import { sessionApi } from '@/api/sessionApi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { FloorMapComputerItem } from '@/types/computer';
import type { ErrorResponse, SessionResponse } from '@/types/auth';

interface EndSessionModalProps {
  open: boolean;
  computer: FloorMapComputerItem | null;
  onClose: () => void;
  onSuccess: (session: SessionResponse) => void;
}

export const EndSessionModal: React.FC<EndSessionModalProps> = ({
  open,
  computer,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  if (!computer || !computer.activeSession) return null;

  const session = computer.activeSession;
  const remainingMinutes = session.remainingMinutesUntilExpiry ?? 0;

  const handleConfirmEnd = async () => {
    setSubmitting(true);
    try {
      const res = await sessionApi.endSession(session.id);
      message.success(
        `Đã kết thúc phiên chơi cho khách ${session.accountName || 'hàng'} tại máy ${computer.code}!`
      );
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ErrorResponse;
      if (apiErr.errorCode === 'SESSION_NOT_ACTIVE') {
        message.warning('Phiên chơi này đã kết thúc trước đó!');
        onClose();
      } else {
        message.error(apiErr.message || 'Kết thúc phiên thất bại. Vui lòng thử lại!');
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
      width={480}
      styles={{
        body: {
          backgroundColor: '#10232A',
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
        <div className="flex items-center gap-3 pb-4 border-b border-[rgba(167,158,156,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-danger/15 text-danger border border-danger/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(239,83,80,0.25)]">
            <Square className="w-5 h-5 text-danger" />
          </div>

          <div>
            <h2 className="font-heading font-extrabold text-lg text-sand tracking-wide flex items-center gap-2">
              Kết Thúc Phiên Chơi
            </h2>
            <p className="text-xs text-mist">
              Đóng phiên máy trạm và hoàn trả số phút chưa sử dụng về tài khoản.
            </p>
          </div>
        </div>

        {/* 2. Cảnh báo an toàn */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-xs text-danger/90">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Bạn đang yêu cầu đóng phiên chơi của máy <strong className="text-sand">{computer.code}</strong>. Khách hàng sẽ bị đăng xuất khỏi máy trạm ngay lập tức!
          </div>
        </div>

        {/* 3. Tóm tắt thông tin phiên */}
        <GlassCard className="p-4 rounded-xl border border-[rgba(167,158,156,0.15)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-mist flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-gold" />
              Máy trạm:
            </span>
            <span className="font-heading font-bold text-sand">
              {computer.code} ({computer.zone})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-mist flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" />
              Khách hàng:
            </span>
            <span className="font-bold text-sand">
              {session.accountName || 'Khách vãng lai'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-mist flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-mist" />
              Số điện thoại:
            </span>
            <span className="font-mono text-sand">
              {session.accountPhone}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-mist flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-mist" />
              Bắt đầu lúc:
            </span>
            <span className="font-mono text-sand">
              {dayjs(session.startedAt).format('HH:mm • DD/MM/YYYY')}
            </span>
          </div>

          {/* Cơ chế hoàn giờ */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[rgba(167,158,156,0.1)]">
            <span className="text-success font-medium flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Hoàn trả tài khoản:
            </span>
            <Tag bordered={false} className="m-0 font-mono font-bold text-xs bg-success/15 text-success border border-success/30 px-2 py-0.5 rounded-full">
              +{remainingMinutes} phút
            </Tag>
          </div>
        </GlassCard>

        {/* 4. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(167,158,156,0.12)]">
          <Button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl h-10 text-xs px-5 bg-transparent border-[rgba(167,158,156,0.2)] text-sand hover:text-mist"
          >
            Hủy bỏ
          </Button>

          <Button
            danger
            type="primary"
            onClick={handleConfirmEnd}
            loading={submitting}
            icon={!submitting && <Square className="w-3.5 h-3.5" />}
            className="rounded-xl h-10 text-xs px-6 font-bold cursor-pointer shadow-[0_4px_16px_rgba(239,83,80,0.3)]"
          >
            {submitting ? 'ĐANG KẾT THÚC...' : 'XÁC NHẬN KẾT THÚC'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
