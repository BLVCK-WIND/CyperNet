import React, { useState } from 'react';
import { Modal, Input, Button, Checkbox, App, Tag, Radio } from 'antd';
import {
  UserPlus,
  Phone,
  User,
  Lock,
  Coins,
  Clock,
  Banknote,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { accountApi } from '@/api/accountApi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Account } from '@/types/auth';

interface RegisterCustomerModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (newAccount: Account, initialPassword: string) => void;
}

const PRESET_DEPOSITS = [
  { amount: 10000, label: '10.000 ₫', minutes: 60, desc: '1 giờ' },
  { amount: 20000, label: '20.000 ₫', minutes: 120, desc: '2 giờ' },
  { amount: 50000, label: '50.000 ₫', minutes: 300, desc: '5 giờ (Phổ biến)' },
  { amount: 100000, label: '100.000 ₫', minutes: 600, desc: '10 giờ' },
  { amount: 200000, label: '200.000 ₫', minutes: 1200, desc: '20 giờ' },
];

export const RegisterCustomerModal: React.FC<RegisterCustomerModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [useDefaultPassword, setUseDefaultPassword] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(50000);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('50000');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
  const [submitting, setSubmitting] = useState(false);

  // Tính số phút chuẩn Standard cơ sở (10k = 60 phút)
  const currentDeposit = isCustomAmount ? (parseInt(customAmountInput, 10) || 0) : depositAmount;
  const standardMinutes = Math.floor((currentDeposit * 60) / 10000);
  const standardHours = (standardMinutes / 60).toFixed(1);

  // Mật khẩu dự kiến
  const predictedPassword = useDefaultPassword
    ? phone.length >= 4
      ? phone.slice(-4)
      : '••••'
    : customPassword || '••••';

  const resetForm = () => {
    setPhone('');
    setName('');
    setUseDefaultPassword(true);
    setCustomPassword('');
    setDepositAmount(50000);
    setIsCustomAmount(false);
    setCustomAmountInput('50000');
    setPaymentMethod('CASH');
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) {
      message.warning('Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số)!');
      return;
    }

    if (!cleanName || cleanName.length < 2) {
      message.warning('Vui lòng nhập họ và tên khách hàng (tối thiểu 2 ký tự)!');
      return;
    }

    if (currentDeposit < 10000) {
      message.warning('Số tiền nạp lần đầu tối thiểu là 10.000 VNĐ!');
      return;
    }

    if (!useDefaultPassword && (!customPassword || customPassword.length < 4)) {
      message.warning('Mật khẩu tự đặt phải từ 4 ký tự trở lên!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await accountApi.registerWithDeposit({
        phone: cleanPhone,
        name: cleanName,
        password: useDefaultPassword ? '' : customPassword,
        initialDeposit: currentDeposit,
        paymentMethod,
      });

      // Làm mới cache danh sách khách hàng
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-recent-time-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats-summary'] }),
      ]);

      const initialPw = res.initialPassword;

      modal.success({
        title: (
          <span className="text-sand font-heading font-bold text-base">
            Đăng Ký Hội Viên Thành Công!
          </span>
        ),
        content: (
          <div className="space-y-3 pt-2 text-xs text-sand">
            <p className="text-mist">
              Hệ thống đã tạo tài khoản và nạp thành công{' '}
              <strong className="text-gold font-bold">
                {new Intl.NumberFormat('vi-VN').format(currentDeposit)} ₫
              </strong>{' '}
              ({standardMinutes} phút chơi).
            </p>

            <div className="p-3 rounded-xl bg-midnight/90 border border-gold/30 font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-mist">Hội viên:</span>
                <strong className="text-sand">{res.account.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Số điện thoại:</span>
                <strong className="text-gold">{res.account.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-mist">Mật khẩu:</span>
                <Tag className="m-0 bg-gold/20 text-gold border-gold/40 font-bold font-mono">
                  {initialPw}
                </Tag>
              </div>
            </div>

            <p className="text-[11px] text-mist/70 italic">
              * Nhân viên vui lòng thông báo mật khẩu trên cho khách hàng.
            </p>
          </div>
        ),
        okText: 'Xác Nhận & Tiếp Tục',
        okButtonProps: {
          className: 'bg-gold hover:bg-gold-light text-midnight font-bold border-0',
        },
      });

      onSuccess(res.account, initialPw);
      resetForm();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(
        errorObj.response?.data?.message || 'Không thể đăng ký tài khoản hội viên. Vui lòng thử lại!'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      maskClosable={false}
      width={540}
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
      <div className="p-6 text-sand select-none space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-mist/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark text-midnight flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(189,152,117,0.3)]">
            <UserPlus className="w-5 h-5 text-midnight" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-lg text-sand tracking-wide flex items-center gap-2">
              Đăng Ký Hội Viên Tại Quầy
            </h2>
            <p className="text-xs text-mist">
              Mở tài khoản trực tiếp tại quầy POS kèm nạp giờ chơi ban đầu (tối thiểu 10.000 ₫).
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5">
          {/* SĐT & Tên Khách Hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="reg-phone"
                className="block text-xs font-semibold text-mist uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-gold" />
                Số điện thoại <span className="text-danger">*</span>
              </label>
              <Input
                id="reg-phone"
                size="large"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="VD: 0987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={submitting}
                className="bg-midnight/70 text-sand border-mist/30 hover:border-gold/60 focus:border-gold h-11 text-sm font-mono rounded-xl"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-mist uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-gold" />
                Họ và tên <span className="text-danger">*</span>
              </label>
              <Input
                id="reg-name"
                size="large"
                placeholder="VD: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                className="bg-midnight/70 text-sand border-mist/30 hover:border-gold/60 focus:border-gold h-11 text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Thiết lập mật khẩu */}
          <GlassCard className="p-3.5 rounded-xl border border-mist/20 bg-slate/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <Checkbox
                checked={useDefaultPassword}
                onChange={(e) => setUseDefaultPassword(e.target.checked)}
                className="text-xs text-sand font-medium"
              >
                Mặc định sử dụng 4 số cuối SĐT làm mật khẩu
              </Checkbox>

              <Tag className="m-0 bg-gold/15 text-gold border-gold/30 font-mono text-[11px] font-bold">
                MK: {predictedPassword}
              </Tag>
            </div>

            {!useDefaultPassword && (
              <div>
                <label
                  htmlFor="reg-custom-pw"
                  className="block text-[11px] font-semibold text-mist uppercase tracking-wider mb-1 flex items-center gap-1"
                >
                  <Lock className="w-3 h-3 text-gold" />
                  Mật khẩu tự đặt cho khách
                </label>
                <Input.Password
                  id="reg-custom-pw"
                  size="middle"
                  placeholder="Nhập tối thiểu 4 ký tự"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  disabled={submitting}
                  className="bg-midnight/70 text-sand border-mist/30 hover:border-gold/60 focus:border-gold h-9.5 text-xs rounded-lg"
                />
              </div>
            )}
          </GlassCard>

          {/* Mệnh giá nạp ban đầu */}
          <div>
            <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-gold" />
                Nạp tiền lần đầu (Tối thiểu 10.000 ₫) <span className="text-danger">*</span>
              </span>
              <span className="text-[11px] text-gold font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {standardMinutes} phút (~{standardHours}h standard)
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESET_DEPOSITS.map((p) => {
                const isSelected = !isCustomAmount && depositAmount === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(false);
                      setDepositAmount(p.amount);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gold/20 border-gold text-sand shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                        : 'bg-slate/30 border-mist/20 text-sand/80 hover:border-gold/40 hover:bg-slate/40'
                    }`}
                  >
                    <div className="font-heading font-bold text-xs text-sand">{p.label}</div>
                    <div className="text-[10px] text-mist font-mono mt-0.5">{p.desc}</div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomAmount(true)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isCustomAmount
                    ? 'bg-gold/20 border-gold text-sand shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                    : 'bg-slate/30 border-mist/20 text-sand/80 hover:border-gold/40 hover:bg-slate/40'
                }`}
              >
                <div className="font-heading font-bold text-xs text-sand">Số khác...</div>
                <div className="text-[10px] text-mist font-mono mt-0.5">Tùy chọn</div>
              </button>
            </div>

            {isCustomAmount && (
              <div className="mt-2">
                <Input
                  size="large"
                  type="number"
                  min={10000}
                  step={5000}
                  placeholder="Nhập số tiền nạp (VD: 30000, 70000...)"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  className="bg-midnight/70 text-sand border-gold/40 hover:border-gold focus:border-gold h-10 text-sm font-mono rounded-xl"
                  suffix={<span className="text-xs text-gold font-bold">VNĐ</span>}
                />
              </div>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <label className="block text-xs font-semibold text-mist uppercase tracking-wider mb-2">
              Phương thức thu tiền
            </label>

            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full grid grid-cols-2 gap-3"
            >
              <Radio.Button
                value="CASH"
                className="h-11 rounded-xl flex items-center justify-center gap-2 border-mist/30 text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-success" />
                  <span>Tiền mặt (CASH)</span>
                </div>
              </Radio.Button>

              <Radio.Button
                value="QR"
                className="h-11 rounded-xl flex items-center justify-center gap-2 border-mist/30 text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#85C1DC]" />
                  <span>VietQR Quầy</span>
                </div>
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-mist/20 flex items-center justify-end gap-3">
            <Button
              type="text"
              onClick={handleClose}
              disabled={submitting}
              className="h-11 px-5 rounded-xl text-sand/80 hover:text-sand hover:bg-slate/40"
            >
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="h-11 px-6 rounded-xl bg-gold hover:bg-gold-light text-midnight font-bold border-0 shadow-lg shadow-gold/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-midnight" />
              <span>
                Tạo Hội Viên & Thu {new Intl.NumberFormat('vi-VN').format(currentDeposit)} ₫
              </span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
