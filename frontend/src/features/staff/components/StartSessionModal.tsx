import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Tag, Skeleton, App } from 'antd';
import {
  PlayCircle,
  Monitor,
  User,
  Zap,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { accountApi } from '@/api/accountApi';
import { sessionApi } from '@/api/sessionApi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { FloorMapComputerItem } from '@/types/computer';
import type { Account, ErrorResponse, SessionResponse } from '@/types/auth';

interface StartSessionModalProps {
  open: boolean;
  computer: FloorMapComputerItem | null;
  availableComputers?: FloorMapComputerItem[];
  onClose: () => void;
  onSuccess: (session: SessionResponse) => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  open,
  computer,
  availableComputers = [],
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [selectedComputerId, setSelectedComputerId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Đồng bộ máy trạm khi mở modal
  useEffect(() => {
    if (computer) {
      setSelectedComputerId(computer.id);
    } else if (availableComputers.length > 0) {
      setSelectedComputerId(availableComputers[0].id);
    } else {
      setSelectedComputerId(null);
    }
    setSelectedAccountId(null);
  }, [computer, availableComputers, open]);

  // Lấy danh sách tài khoản khách hàng (CUSTOMER)
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['staff-customer-accounts'],
    queryFn: () => accountApi.getAccounts({ role: 'CUSTOMER', size: 100 }),
    enabled: open,
  });

  const accounts: Account[] = accountsData?.content || [];

  // Tìm máy đang chọn
  const activeComputer =
    (computer?.id === selectedComputerId ? computer : null) ||
    availableComputers.find((c) => c.id === selectedComputerId) ||
    computer;

  // Tìm khách hàng đang chọn
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const remainingMinutes = selectedAccount?.remainingMinutes ?? 0;
  const isInsufficient = selectedAccount && remainingMinutes <= 0;

  // Format đơn giá giờ
  const formattedPrice = activeComputer
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(activeComputer.pricePerHour)
    : '0 ₫';

  const handleConfirm = async () => {
    if (!activeComputer || !selectedAccountId) {
      message.warning('Vui lòng chọn đầy đủ máy trạm và khách hàng!');
      return;
    }

    if (isInsufficient) {
      message.error('Tài khoản khách hàng không đủ số phút chơi để mở máy!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sessionApi.startSession({
        computerId: activeComputer.id,
        accountId: selectedAccountId,
      });

      message.success(
        `Đã mở máy ${res.computerCode} thành công cho khách hàng ${res.accountName}!`
      );
      onSuccess(res);
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ErrorResponse;
      if (apiErr.errorCode === 'SESSION_ACCOUNT_IN_USE') {
        message.error('Khách hàng này hiện đang có một phiên chơi khác đang hoạt động!');
      } else if (apiErr.errorCode === 'COMPUTER_NOT_AVAILABLE') {
        message.error(`Máy trạm ${activeComputer.code} hiện không ở trạng thái sẵn sàng!`);
      } else if (apiErr.errorCode === 'SESSION_INSUFFICIENT_TIME') {
        message.error('Tài khoản không đủ số phút khả dụng để mở máy!');
      } else {
        message.error(apiErr.message || 'Mở phiên chơi thất bại. Vui lòng kiểm tra lại!');
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-midnight flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(181,136,99,0.3)]">
            <PlayCircle className="w-5 h-5 text-midnight" />
          </div>

          <div>
            <h2 className="font-heading font-extrabold text-lg text-sand tracking-wide flex items-center gap-2">
              Mở Phiên Chơi Tại Quầy
            </h2>
            <p className="text-xs text-mist">
              Hệ thống áp dụng Phương án A: Tự động dùng toàn bộ số dư thời gian của khách.
            </p>
          </div>
        </div>

        {/* 2. Chọn máy tính (nếu mở dạng Quick Action không chỉ định trước) */}
        {!computer && availableComputers.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-gold" />
              Chọn máy trạm sẵn sàng
            </label>
            <Select
              className="w-full h-11"
              value={selectedComputerId}
              onChange={(val) => setSelectedComputerId(val)}
              options={availableComputers.map((c) => ({
                value: c.id,
                label: `${c.code} (${c.zone}) • ${new Intl.NumberFormat('vi-VN').format(c.pricePerHour)}đ/h`,
              }))}
            />
          </div>
        )}

        {/* 3. Thẻ Thông Tin Máy Trạm Được Chọn */}
        {activeComputer && (
          <GlassCard className="p-3.5 rounded-xl border border-success/30 bg-[rgba(61,77,85,0.35)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/15 text-success flex items-center justify-center font-bold">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sand text-sm">
                    {activeComputer.code}
                  </span>
                  {activeComputer.zone === 'VIP' ? (
                    <Tag bordered={false} className="m-0 text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/30">
                      VIP
                    </Tag>
                  ) : (
                    <Tag bordered={false} className="m-0 text-[10px] font-medium bg-[rgba(61,77,85,0.6)] text-sand">
                      STANDARD
                    </Tag>
                  )}
                </div>
                <span className="text-[11px] font-mono text-mist">
                  IP: {activeComputer.ipAddress}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-mist block">Đơn giá</span>
              <span className="text-xs font-mono font-bold text-gold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {formattedPrice}/h
              </span>
            </div>
          </GlassCard>
        )}

        {/* 4. Chọn Khách Hàng (Search by Phone & Name) */}
        <div>
          <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold" />
            Chọn khách hàng (Tìm theo SĐT hoặc Tên)
          </label>

          {isLoadingAccounts ? (
            <Skeleton.Input active className="w-full h-11 rounded-xl" />
          ) : (
            <Select
              showSearch
              placeholder="Nhập SĐT hoặc tên khách hàng..."
              optionFilterProp="label"
              value={selectedAccountId}
              onChange={(val) => setSelectedAccountId(val)}
              className="w-full h-11"
              options={accounts.map((acc) => ({
                value: acc.id,
                label: `[${acc.phone}] ${acc.name} • ${acc.remainingMinutes} phút`,
              }))}
            />
          )}
        </div>

        {/* 5. Tóm tắt Khách Hàng & Cảnh Báo Số Dư */}
        {selectedAccount && (
          <GlassCard
            className={`p-4 rounded-xl border transition-all ${
              isInsufficient
                ? 'border-danger/40 bg-danger/10'
                : 'border-gold/30 bg-[rgba(181,136,99,0.08)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sand text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold" />
                {selectedAccount.name} ({selectedAccount.phone})
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  isInsufficient
                    ? 'bg-danger/20 text-danger'
                    : 'bg-gold/20 text-gold'
                }`}
              >
                Số dư: {remainingMinutes} phút
              </span>
            </div>

            {isInsufficient ? (
              <div className="flex items-start gap-2 text-xs text-danger/90 pt-1 border-t border-danger/20">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Tài khoản đã hết số phút chơi. Vui lòng nạp thêm giờ chơi tại POS Bán Giờ trước khi mở máy!
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-mist pt-1 border-t border-[rgba(181,136,99,0.15)] font-mono">
                <span>Ước tính thời gian chơi:</span>
                <span className="text-sand font-bold">
                  {(remainingMinutes / 60).toFixed(1)} giờ
                </span>
              </div>
            )}
          </GlassCard>
        )}

        {/* 6. Ghi chú nghiệp vụ Phương án A */}
        <div className="p-3 rounded-xl bg-midnight border border-[rgba(167,158,156,0.12)] text-[11px] text-mist/80 space-y-1">
          <div className="flex items-center gap-1.5 text-sand font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Cơ chế hoàn giờ chơi tự động (Phương án A):
          </div>
          <p className="leading-relaxed">
            Hệ thống không yêu cầu nhân viên nhập số phút. Toàn bộ số dư khả dụng sẽ được kích hoạt; khi đóng phiên, thời gian chơi thực tế sẽ được trừ chính xác và <strong>100% số phút dư</strong> được tự động hoàn lại tài khoản khách.
          </p>
        </div>

        {/* 7. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(167,158,156,0.12)]">
          <Button
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl h-10 text-xs px-5 bg-transparent border-[rgba(167,158,156,0.2)] text-sand hover:text-mist"
          >
            Hủy bỏ
          </Button>

          <Button
            type="primary"
            onClick={handleConfirm}
            loading={submitting}
            disabled={!activeComputer || !selectedAccountId || isInsufficient}
            icon={!submitting && <PlayCircle className="w-4 h-4" />}
            className="rounded-xl h-10 text-xs px-6 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'ĐANG MỞ MÁY...' : 'XÁC NHẬN MỞ MÁY'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
