import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Tag, Skeleton, InputNumber, App } from 'antd';
import {
  ClockPlus,
  Coins,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  User,
  ShieldCheck,
  Monitor,
  UserPlus,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { accountApi } from '@/api/accountApi';
import { timePurchaseApi } from '@/api/timePurchaseApi';
import { orderApi } from '@/api/orderApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { RegisterCustomerModal } from './RegisterCustomerModal';
import type { Account } from '@/types/auth';
import type { FloorMapComputerItem } from '@/types/computer';
import type { TimePurchaseResponse, PaymentMethod } from '@/types/timePurchase';
import type { VietQrResponse } from '@/types/order';

interface SellTimeModalProps {
  open: boolean;
  initialAccountId?: number | null;
  targetComputer?: FloorMapComputerItem | null;
  onClose: () => void;
  onSuccess?: (timePurchase: TimePurchaseResponse) => void;
}

// Các mệnh giá nạp tiền mặt phổ biến tại tiệm net Việt Nam
const PRESET_AMOUNTS = [
  { amount: 10000, label: '10.000 đ' },
  { amount: 20000, label: '20.000 đ' },
  { amount: 50000, label: '50.000 đ', isPopular: true },
  { amount: 100000, label: '100.000 đ' },
  { amount: 200000, label: '200.000 đ' },
  { amount: 500000, label: '500.000 đ' },
];

export const SellTimeModal: React.FC<SellTimeModalProps> = ({
  open,
  initialAccountId,
  targetComputer,
  onClose,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'FORM' | 'QR_PAYMENT' | 'SUCCESS'>('FORM');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [pricePerHour, setPricePerHour] = useState<number>(10000);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(300);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const [submitting, setSubmitting] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [confirmingQr, setConfirmingQr] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<TimePurchaseResponse | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);

  const BASE_TARIFF = 10000;

  // Khôi phục & khởi tạo giá trị khi mở modal
  useEffect(() => {
    if (open) {
      setStep('FORM');
      setSelectedAccountId(initialAccountId || null);

      if (targetComputer) {
        const price = Number(targetComputer.pricePerHour) || (targetComputer.zone === 'VIP' ? 20000 : 10000);
        setPricePerHour(price);
      } else {
        setPricePerHour(10000);
      }

      setSelectedAmount(50000);
      setSelectedMinutes(300); // 50.000đ = 300 phút chuẩn Standard cơ sở
      setIsCustomAmount(false);
      setPaymentMethod('CASH');
      setCreatedPurchase(null);
      setVietQrData(null);
    }
  }, [open, initialAccountId, targetComputer]);

  // Lấy danh sách khách hàng (role: CUSTOMER)
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['staff-customer-accounts'],
    queryFn: () => accountApi.getAccounts({ role: 'CUSTOMER', size: 100 }),
    enabled: open,
  });

  const accounts: Account[] = accountsData?.content || [];
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // Số phút chuẩn Standard (cơ sở lưu vào bảng accounts trong DB)
  const standardMinutes = Math.round((selectedAmount / BASE_TARIFF) * 60);
  // Số phút thực tế chơi được tại máy hiện tại (nếu mở nạp từ máy)
  const machinePlayableMinutes = Math.floor((standardMinutes * BASE_TARIFF) / pricePerHour);

  // Chọn mệnh giá nạp tiền nhanh (10k, 20k, 50k, 100k...)
  const handleSelectAmount = (amt: number) => {
    setIsCustomAmount(false);
    setSelectedAmount(amt);
    const mins = Math.round((amt / BASE_TARIFF) * 60);
    setSelectedMinutes(mins);
  };

  // Thay đổi số tiền tùy chỉnh
  const handleCustomAmountChange = (value: number | null) => {
    const amt = value || 0;
    setSelectedAmount(amt);
    const calculatedMinutes = Math.round((amt / BASE_TARIFF) * 60);
    setSelectedMinutes(calculatedMinutes);
  };

  // Thay đổi số phút tùy chỉnh
  const handleCustomMinutesChange = (value: number | null) => {
    const mins = value || 0;
    setSelectedMinutes(mins);
    const calculatedAmount = Math.round((mins / 60) * BASE_TARIFF);
    setSelectedAmount(calculatedAmount);
  };

  // Bước 1: Tạo phiếu & Xử lý thanh toán
  const handleCreatePurchase = async () => {
    if (!selectedAccountId) {
      message.error('Vui lòng chọn tài khoản khách hàng để nạp giờ!');
      return;
    }
    if (standardMinutes <= 0 || selectedAmount <= 0) {
      message.error('Số phút nạp và số tiền phải lớn hơn 0!');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tạo phiếu nạp giờ (luôn gửi số phút chuẩn Standard để backend lưu DB đúng nghiệp vụ)
      const newPurchase = await timePurchaseApi.createTimePurchase({
        accountId: selectedAccountId,
        minutes: standardMinutes,
        amount: selectedAmount,
        paymentMethod,
      });

      if (paymentMethod === 'CASH') {
        // Thu tiền mặt: Tự động xác nhận luôn
        const confirmed = await timePurchaseApi.confirmTimePurchase(newPurchase.id);
        setCreatedPurchase(confirmed);
        setStep('SUCCESS');
        message.success(
          `Đã nạp thành công ${selectedMinutes} phút cho khách hàng ${selectedAccount?.name}!`
        );

        // Làm mới cache tài khoản & sơ đồ máy
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
          queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
          queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
        ]);

        if (onSuccess) onSuccess(confirmed);
      } else {
        // VietQR: Sinh mã QR động Napas247
        const qr = await orderApi.generateVietQR(
          selectedAmount,
          `NAPGIO ${newPurchase.id} ${selectedAccount?.phone || ''}`
        );
        setCreatedPurchase(newPurchase);
        setVietQrData(qr);
        setStep('QR_PAYMENT');
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể tạo phiếu nạp giờ lúc này!');
    } finally {
      setSubmitting(false);
    }
  };

  // Bước 2: Xác nhận thanh toán VietQR
  const handleConfirmQr = async () => {
    if (!createdPurchase) return;
    setConfirmingQr(true);
    try {
      const confirmed = await timePurchaseApi.confirmTimePurchase(createdPurchase.id);
      setCreatedPurchase(confirmed);
      setStep('SUCCESS');
      message.success(
        `Đã nhận thanh toán QR và nạp ${confirmed.minutes} phút cho ${selectedAccount?.name}!`
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
      ]);

      if (onSuccess) onSuccess(confirmed);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể xác nhận thanh toán!');
    } finally {
      setConfirmingQr(false);
    }
  };

  // In biên lai
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
      styles={{
        body: {
          backgroundColor: '#202332',
          padding: '28px',
          borderRadius: '24px',
          color: '#E0D8D0',
        },
        mask: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        },
      }}
    >
      {/* ========================================================= */}
      {/* STEP 1: FORM CHỌN KHÁCH & MỆNH GIÁ TIỀN                   */}
      {/* ========================================================= */}
      {step === 'FORM' && (
        <div className="space-y-5 select-none">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-mist/20 pb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_16px_rgba(189,152,117,0.3)]">
              <ClockPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-sand flex items-center gap-2">
                Bán giờ chơi tại quầy (Sell Time POS)
              </h2>
              <p className="text-xs text-mist">
                Nạp tiền quy đổi giờ chơi trực tiếp vào tài khoản hội viên CyberNet
              </p>
            </div>
          </div>

          {/* 1. Chọn tài khoản khách hàng */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gold" />
                Khách hàng nạp tiền <span className="text-danger">*</span>
              </label>

              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className="text-[11px] font-bold text-gold hover:text-gold-light flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Hội viên mới</span>
              </button>
            </div>

            {isLoadingAccounts ? (
              <Skeleton.Input active block className="h-11 rounded-xl" />
            ) : (
              <Select
                showSearch
                value={selectedAccountId}
                onChange={(val) => setSelectedAccountId(val)}
                placeholder="Tìm theo SĐT hoặc tên khách..."
                optionFilterProp="label"
                className="w-full h-11 text-sand"
                popupClassName="cyberlux-select-dropdown"
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.phone} • ${acc.name}`,
                }))}
                optionRender={(oriOption) => {
                  const acc = accounts.find((a) => a.id === oriOption.value);
                  if (!acc) return oriOption.label;
                  return (
                    <div className="flex items-center justify-between py-0.5 text-xs">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-sand font-bold shrink-0">
                          {acc.phone}
                        </span>
                        <span className="text-sand/90 truncate font-medium">
                          {acc.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-gold font-mono font-bold text-[11px] bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                        {acc.remainingMinutes} phút
                      </span>
                    </div>
                  );
                }}
              />
            )}

            {/* Thẻ tóm tắt số dư hiện tại của khách */}
            {selectedAccount && (
              <GlassCard className="mt-2.5 p-3 rounded-xl border border-gold/20 bg-midnight/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sand">{selectedAccount.name}</div>
                  <div className="text-[11px] text-mist">{selectedAccount.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-mist">Số dư hiện tại</div>
                  <div className="text-xs font-bold text-gold font-mono">
                    {selectedAccount.remainingMinutes} phút (~
                    {(selectedAccount.remainingMinutes / 60).toFixed(1)}h)
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* 2. Đơn giá & Khu vực máy (Dynamic Tariff) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-gold" />
                Đơn giá nạp giờ
              </label>
              <span className="text-[11px] font-mono text-gold font-bold">
                {new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ / giờ
              </span>
            </div>

            {targetComputer ? (
              <GlassCard className="p-3 rounded-xl border border-gold/30 bg-gold/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gold" />
                  <div>
                    <div className="text-xs font-bold text-sand">
                      Máy {targetComputer.code} ({targetComputer.zone})
                    </div>
                    <div className="text-[11px] text-mist">Đang mở nạp giờ từ sơ đồ máy</div>
                  </div>
                </div>
                <Tag color="gold" className="m-0 font-mono font-bold text-xs">
                  {new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ/giờ
                </Tag>
              </GlassCard>
            ) : (
              <GlassCard className="p-3 rounded-xl border border-mist/20 bg-midnight/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-gold" />
                  <div>
                    <div className="text-xs font-bold text-sand">Biểu phí tài khoản chuẩn</div>
                    <div className="text-[11px] text-mist">Quy đổi 10.000đ = 60 phút Standard (166.7đ/phút)</div>
                  </div>
                </div>
                <Tag color="blue" className="m-0 font-mono font-bold text-xs">
                  10.000đ/giờ
                </Tag>
              </GlassCard>
            )}
          </div>

          {/* 3. Mệnh giá nạp tiền (VNĐ) */}
          <div>
            <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-gold" />
              Số tiền nạp (VNĐ)
            </label>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {PRESET_AMOUNTS.map((item) => {
                const isSelected = !isCustomAmount && selectedAmount === item.amount;
                // Tính số phút quy đổi theo đơn giá zone hiện tại
                const equivMins = Math.round((item.amount / pricePerHour) * 60);
                const equivHours = (equivMins / 60).toFixed(1);

                return (
                  <button
                    key={item.amount}
                    type="button"
                    onClick={() => handleSelectAmount(item.amount)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'border-gold bg-gold/15 text-sand shadow-[0_0_12px_rgba(189,152,117,0.3)] ring-1 ring-gold'
                        : 'border-mist/20 bg-midnight/50 text-mist hover:border-gold/50 hover:text-sand'
                    }`}
                  >
                    {item.isPopular && (
                      <span className="absolute -top-2 right-2 bg-gradient-to-r from-gold to-warning text-midnight text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow">
                        HOT
                      </span>
                    )}
                    <span className="font-heading font-extrabold text-xs sm:text-sm text-sand">
                      {item.label}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-gold mt-0.5">
                      {equivMins} phút (~{equivHours}h)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Khung Tùy chỉnh nếu muốn nhập số tiền khác */}
            <div className="p-3 rounded-xl bg-midnight/60 border border-mist/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-mist">
                  Hoặc tự nhập số tiền / số phút tùy ý:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomAmount(!isCustomAmount)}
                  className="text-[11px] text-gold hover:underline cursor-pointer"
                >
                  {isCustomAmount ? 'Dùng gói gợi ý' : 'Nhập tự do'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-mist block mb-1">Số tiền khách đưa (VNĐ):</span>
                  <InputNumber
                    min={1000}
                    step={5000}
                    value={selectedAmount}
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '') || 0)}
                    onChange={(val) => {
                      setIsCustomAmount(true);
                      handleCustomAmountChange(val);
                    }}
                    className="w-full rounded-lg text-xs"
                    addonAfter="đ"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-mist block mb-1">Quy đổi số phút:</span>
                  <InputNumber
                    min={15}
                    step={15}
                    value={selectedMinutes}
                    onChange={(val) => {
                      setIsCustomAmount(true);
                      handleCustomMinutesChange(val);
                    }}
                    className="w-full rounded-lg text-xs"
                    addonAfter="phút"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Phương thức thanh toán */}
          <div>
            <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-gold" />
              Phương thức thanh toán
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`h-11 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-gold bg-gold/15 text-sand shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                    : 'border-mist/20 bg-midnight/50 text-mist hover:text-sand hover:border-gold/30'
                }`}
              >
                <Banknote className="w-4 h-4 text-success" />
                Tiền mặt (Cash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QR')}
                className={`h-11 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'QR'
                    ? 'border-gold bg-gold/15 text-sand shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                    : 'border-mist/20 bg-midnight/50 text-mist hover:text-sand hover:border-gold/30'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#85C1DC]" />
                VietQR Napas247
              </button>
            </div>
          </div>

          {/* 5. Tóm tắt thanh toán & Quy đổi phút */}
          <GlassCard className="p-4 rounded-xl border border-mist/20 bg-midnight/90 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-mist block">
                Số tiền nạp: <strong className="text-sand font-mono">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAmount)}</strong>
              </span>
              <div className="text-xs text-mist">
                Quy đổi chuẩn: <strong className="text-sand">{standardMinutes} phút Standard</strong>
              </div>
              {targetComputer && (
                <div className="text-xs text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>
                    Gia hạn máy {targetComputer.code}: <strong className="font-mono text-sand">+{machinePlayableMinutes} phút</strong> (~{(machinePlayableMinutes / 60).toFixed(1)}h)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="font-heading font-extrabold text-xl text-gold font-mono block">
                +{targetComputer ? machinePlayableMinutes : standardMinutes}p
              </span>
              <span className="text-[11px] text-mist">
                {targetComputer ? 'cộng vào phiên máy' : 'cộng vào tài khoản'}
              </span>
            </div>
          </GlassCard>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl text-xs bg-slate/40 border border-mist/25 text-sand hover:text-white cursor-pointer"
            >
              Hủy bỏ
            </Button>

            <Button
              type="primary"
              loading={submitting}
              onClick={handleCreatePurchase}
              disabled={!selectedAccountId || selectedMinutes <= 0}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
            >
              {paymentMethod === 'CASH' ? 'Thu tiền mặt & Nạp ngay' : 'Tạo mã VietQR'}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: MÀN HÌNH VIETQR                                  */}
      {/* ========================================================= */}
      {step === 'QR_PAYMENT' && vietQrData && createdPurchase && (
        <div className="space-y-5 text-center select-none">
          <div className="border-b border-mist/20 pb-3">
            <Tag color="cyan" className="font-bold text-xs px-2.5 py-0.5 rounded-full mb-1">
              VietQR Chuyển Khoản Nhanh 24/7
            </Tag>
            <h2 className="text-base font-bold font-heading text-sand">
              Quét mã để nạp {createdPurchase.minutes} phút
            </h2>
            <p className="text-xs text-mist">
              Khách hàng: <strong className="text-sand">{createdPurchase.accountName}</strong> (
              {createdPurchase.accountPhone})
            </p>
          </div>

          {/* Khung chứa ảnh QR */}
          <div className="bg-white p-4 rounded-2xl max-w-[260px] mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <img
              src={vietQrData.qrUrl}
              alt="VietQR Napas247"
              className="w-full h-auto aspect-square object-contain"
            />
          </div>

          {/* Chi tiết chuyển khoản */}
          <GlassCard className="p-3.5 rounded-xl border border-mist/20 text-xs text-mist space-y-1.5 max-w-sm mx-auto">
            <div className="flex justify-between">
              <span>Số tiền:</span>
              <strong className="text-gold font-mono text-sm">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  createdPurchase.amount
                )}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Nội dung CK:</span>
              <strong className="text-sand font-mono">{vietQrData.content}</strong>
            </div>
          </GlassCard>

          {/* Nút hành động */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => setStep('FORM')}
              disabled={confirmingQr}
              className="h-11 rounded-xl text-xs bg-slate/40 border border-mist/25 text-sand cursor-pointer"
            >
              Quay lại
            </Button>

            <Button
              type="primary"
              loading={confirmingQr}
              onClick={handleConfirmQr}
              icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
            >
              Khách đã chuyển khoản
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: BIÊN LAI NẠP TIỀN THÀNH CÔNG (RECEIPT)           */}
      {/* ========================================================= */}
      {step === 'SUCCESS' && createdPurchase && (
        <div className="space-y-5 select-none">
          {/* Huy hiệu thành công */}
          <div className="text-center pt-2">
            <div className="w-14 h-14 rounded-full bg-success/20 text-success border border-success/40 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(76,175,80,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold font-heading text-sand">Nạp Tiền Thành Công!</h2>
            <p className="text-xs text-mist mt-0.5">
              Hệ thống đã quy đổi và cập nhật số dư thời gian vào tài khoản khách hàng.
            </p>
          </div>

          {/* Thẻ Biên Lai Thu Ngân */}
          <div className="p-5 rounded-2xl bg-midnight/90 border border-gold/30 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-sand to-gold" />

            <div className="flex items-center justify-between pb-3 border-b border-mist/20 mb-3">
              <span className="font-mono text-xs text-mist">
                PHIẾU NẠP: <strong className="text-sand">#TP-{createdPurchase.id}</strong>
              </span>
              <Tag
                bordered={false}
                className="m-0 text-[11px] font-bold px-2 py-0.5 rounded bg-success/20 text-success border border-success/30 flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                ĐÃ HOÀN TẤT
              </Tag>
            </div>

            <div className="space-y-2 text-xs text-mist">
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <strong className="text-sand">{createdPurchase.accountName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Số điện thoại:</span>
                <strong className="text-sand font-mono">{createdPurchase.accountPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span>Đơn giá áp dụng:</span>
                <strong className="text-sand">
                  {targetComputer ? `${targetComputer.code} (${targetComputer.zone}) - ` : 'Chuẩn Standard - '}
                  {new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ/h
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Số phút chuẩn Standard:</span>
                <strong className="text-sand font-mono">
                  +{createdPurchase.minutes} phút
                </strong>
              </div>
              {targetComputer && (
                <div className="flex justify-between text-success">
                  <span>Gia hạn phiên máy {targetComputer.code}:</span>
                  <strong className="font-mono font-bold">
                    +{Math.floor((createdPurchase.minutes * BASE_TARIFF) / pricePerHour)} phút (~{(Math.floor((createdPurchase.minutes * BASE_TARIFF) / pricePerHour) / 60).toFixed(1)}h)
                  </strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Số tiền thanh toán:</span>
                <strong className="text-gold font-bold font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    createdPurchase.amount
                  )}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Phương thức:</span>
                <strong className="text-sand">
                  {createdPurchase.paymentMethod === 'QR' ? 'VietQR Napas247' : 'Tiền mặt (Cash)'}
                </strong>
              </div>
              {createdPurchase.confirmedByStaffName && (
                <div className="flex justify-between">
                  <span>Nhân viên thu ngân:</span>
                  <strong className="text-sand">{createdPurchase.confirmedByStaffName}</strong>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-mist/15 text-[11px]">
                <span>Thời gian:</span>
                <span className="font-mono">
                  {dayjs(createdPurchase.confirmedAt || createdPurchase.createdAt).format(
                    'DD/MM/YYYY HH:mm:ss'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              className="h-11 rounded-xl text-xs bg-slate/40 border border-mist/25 text-sand hover:text-white cursor-pointer"
            >
              In biên lai
            </Button>

            <Button
              type="primary"
              onClick={onClose}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(189,152,117,0.3)] cursor-pointer"
            >
              Hoàn tất
            </Button>
          </div>
        </div>
      )}
    </Modal>

    {/* Modal Đăng Ký Hội Viên Mới Tại Quầy */}
    <RegisterCustomerModal
      open={registerModalOpen}
      onCancel={() => setRegisterModalOpen(false)}
      onSuccess={(newAccount) => {
        setSelectedAccountId(newAccount.id);
        setRegisterModalOpen(false);
      }}
    />
  </>
  );
};
