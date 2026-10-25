import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Tag, Skeleton, InputNumber, App, Radio } from 'antd';
import {
  ClockPlus,
  Coins,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  User,
  ShieldCheck,
  Zap,
  Monitor,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { accountApi } from '@/api/accountApi';
import { timePurchaseApi } from '@/api/timePurchaseApi';
import { orderApi } from '@/api/orderApi';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Account } from '@/types/auth';
import type { FloorMapComputerItem, ComputerZone } from '@/types/computer';
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

// Cấu hình đơn giá theo từng Zone phòng máy
const ZONE_OPTIONS: { zone: ComputerZone; label: string; pricePerHour: number }[] = [
  { zone: 'STANDARD', label: 'Zone STANDARD (10.000đ/h)', pricePerHour: 10000 },
  { zone: 'VIP', label: 'Zone VIP (15.000đ/h)', pricePerHour: 15000 },
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
  const [selectedZone, setSelectedZone] = useState<ComputerZone>('STANDARD');
  const [pricePerHour, setPricePerHour] = useState<number>(10000);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(300);
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const [submitting, setSubmitting] = useState(false);
  const [confirmingQr, setConfirmingQr] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<TimePurchaseResponse | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);

  // Khôi phục & khởi tạo giá trị khi mở modal
  useEffect(() => {
    if (open) {
      setStep('FORM');
      setSelectedAccountId(initialAccountId || null);

      // Nếu mở từ máy cụ thể, lấy đúng Zone và đơn giá của máy đó
      if (targetComputer) {
        const zone = targetComputer.zone || 'STANDARD';
        const price = targetComputer.pricePerHour || (zone === 'VIP' ? 15000 : 10000);
        setSelectedZone(zone);
        setPricePerHour(price);
        setSelectedAmount(50000);
        setSelectedMinutes(Math.round((50000 / price) * 60));
      } else {
        setSelectedZone('STANDARD');
        setPricePerHour(10000);
        setSelectedAmount(50000);
        setSelectedMinutes(300); // 50.000 / 10.000 * 60 = 300p
      }

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

  // Khi thay đổi Zone (chỉ cho phép đổi nếu không gắn cứng với targetComputer đang ngồi)
  const handleZoneChange = (zone: ComputerZone) => {
    const option = ZONE_OPTIONS.find((z) => z.zone === zone);
    const newPrice = option ? option.pricePerHour : 10000;
    setSelectedZone(zone);
    setPricePerHour(newPrice);
    // Tính lại số phút theo đơn giá Zone mới
    const newMins = Math.round((selectedAmount / newPrice) * 60);
    setSelectedMinutes(newMins);
  };

  // Chọn mệnh giá nạp tiền nhanh (10k, 20k, 50k, 100k...)
  const handleSelectAmount = (amt: number) => {
    setIsCustomAmount(false);
    setSelectedAmount(amt);
    const mins = Math.round((amt / pricePerHour) * 60);
    setSelectedMinutes(mins);
  };

  // Thay đổi số tiền tùy chỉnh
  const handleCustomAmountChange = (value: number | null) => {
    const amt = value || 0;
    setSelectedAmount(amt);
    const calculatedMinutes = Math.round((amt / pricePerHour) * 60);
    setSelectedMinutes(calculatedMinutes);
  };

  // Thay đổi số phút tùy chỉnh
  const handleCustomMinutesChange = (value: number | null) => {
    const mins = value || 0;
    setSelectedMinutes(mins);
    const calculatedAmount = Math.round((mins / 60) * pricePerHour);
    setSelectedAmount(calculatedAmount);
  };

  // Bước 1: Tạo phiếu & Xử lý thanh toán
  const handleCreatePurchase = async () => {
    if (!selectedAccountId) {
      message.error('Vui lòng chọn tài khoản khách hàng để nạp giờ!');
      return;
    }
    if (selectedMinutes <= 0 || selectedAmount <= 0) {
      message.error('Số phút nạp và số tiền phải lớn hơn 0!');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tạo phiếu nạp giờ
      const newPurchase = await timePurchaseApi.createTimePurchase({
        accountId: selectedAccountId,
        minutes: selectedMinutes,
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
          queryClient.invalidateQueries({ queryKey: ['staff-floor-map-computers'] }),
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
        queryClient.invalidateQueries({ queryKey: ['staff-floor-map-computers'] }),
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
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      destroyOnClose
      styles={{
        body: {
          backgroundColor: '#10232A',
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
          <div className="flex items-center gap-3 border-b border-[rgba(167,158,156,0.15)] pb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_16px_rgba(181,136,99,0.3)]">
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
            <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold" />
              Khách hàng nạp tiền <span className="text-danger">*</span>
            </label>

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
                  label: `${acc.phone} • ${acc.name} (${acc.remainingMinutes} phút)`,
                }))}
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

          {/* 2. Đơn giá & Khu vực máy (Zone Dynamic Tariff) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-mist uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-gold" />
                Đơn giá khu vực (Zone)
              </label>
              <span className="text-[11px] font-mono text-gold">
                {new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ / giờ
              </span>
            </div>

            {targetComputer ? (
              <GlassCard className="p-2.5 rounded-xl border border-gold/30 bg-gold/10 flex items-center justify-between text-xs">
                <span className="text-sand font-medium">
                  Máy đang ngồi: <strong>{targetComputer.code}</strong> ({targetComputer.zone})
                </span>
                <Tag color="gold" className="m-0 font-mono font-bold text-xs">
                  {new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ/h
                </Tag>
              </GlassCard>
            ) : (
              <Radio.Group
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
                className="w-full grid grid-cols-2 gap-2.5"
              >
                {ZONE_OPTIONS.map((opt) => (
                  <Radio.Button
                    key={opt.zone}
                    value={opt.zone}
                    className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                      selectedZone === opt.zone
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-[rgba(167,158,156,0.15)] bg-midnight/60 text-mist'
                    }`}
                  >
                    {opt.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
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
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'border-gold bg-gold/15 text-sand shadow-[0_0_12px_rgba(181,136,99,0.3)]'
                        : 'border-[rgba(167,158,156,0.15)] bg-midnight/50 text-mist hover:border-gold/50 hover:text-sand'
                    }`}
                  >
                    {item.isPopular && (
                      <span className="absolute -top-2 right-2 bg-gradient-to-r from-gold to-warning text-midnight text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow">
                        PHỔ BIẾN
                      </span>
                    )}
                    <span className="font-heading font-extrabold text-sm text-sand">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-gold mt-0.5">
                      {equivMins} phút (~{equivHours}h)
                    </span>
                  </button>
                );
              })}

              {/* Nút Tùy chỉnh */}
              <button
                type="button"
                onClick={() => setIsCustomAmount(true)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center col-span-3 sm:col-span-1 ${
                  isCustomAmount
                    ? 'border-gold bg-gold/15 text-sand shadow-[0_0_12px_rgba(181,136,99,0.3)]'
                    : 'border-[rgba(167,158,156,0.15)] bg-midnight/50 text-mist hover:border-gold/50 hover:text-sand'
                }`}
              >
                <Zap className="w-4 h-4 text-gold mb-0.5" />
                <span className="font-heading font-extrabold text-xs">Tự nhập tiền</span>
                <span className="text-[10px] text-mist/70 mt-0.5">Tiền lẻ / Khác</span>
              </button>
            </div>

            {/* Khung Tùy chỉnh nếu chọn Tự nhập tiền */}
            {isCustomAmount && (
              <GlassCard className="p-3.5 rounded-xl border border-gold/30 bg-midnight/70 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-mist block mb-1">Số tiền khách đưa:</span>
                    <InputNumber
                      min={1000}
                      step={5000}
                      value={selectedAmount}
                      onChange={handleCustomAmountChange}
                      className="w-full rounded-lg"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      addonAfter="đ"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-mist block mb-1">Quy đổi số phút:</span>
                    <InputNumber
                      min={15}
                      step={15}
                      value={selectedMinutes}
                      onChange={handleCustomMinutesChange}
                      className="w-full rounded-lg"
                      addonAfter="phút"
                    />
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* 4. Phương thức thanh toán */}
          <div>
            <label className="text-xs font-semibold text-mist uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-gold" />
              Phương thức thanh toán
            </label>

            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full grid grid-cols-2 gap-3"
            >
              <Radio.Button
                value="CASH"
                className={`h-12 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-[rgba(167,158,156,0.2)] bg-midnight/60 text-mist'
                }`}
              >
                <Banknote className="w-4 h-4 text-success" />
                Tiền mặt (Cash)
              </Radio.Button>

              <Radio.Button
                value="QR"
                className={`h-12 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'QR'
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-[rgba(167,158,156,0.2)] bg-midnight/60 text-mist'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#85C1DC]" />
                VietQR Napas247
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* 5. Tóm tắt thanh toán & Quy đổi phút */}
          <GlassCard className="p-4 rounded-xl border border-[rgba(167,158,156,0.15)] bg-midnight/90 flex items-center justify-between">
            <div>
              <span className="text-xs text-mist block">Khách thanh toán:</span>
              <span className="text-xs text-mist">
                Quy đổi: <strong className="text-sand">{selectedMinutes} phút</strong> (~
                {(selectedMinutes / 60).toFixed(1)}h)
              </span>
            </div>
            <div className="text-right">
              <span className="font-heading font-extrabold text-xl text-gold font-mono block">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  selectedAmount
                )}
              </span>
            </div>
          </GlassCard>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={onClose}
              disabled={submitting}
              className="h-11 rounded-xl text-xs bg-[rgba(61,77,85,0.4)] border border-[rgba(167,158,156,0.2)] text-sand hover:text-white cursor-pointer"
            >
              Hủy bỏ
            </Button>

            <Button
              type="primary"
              loading={submitting}
              onClick={handleCreatePurchase}
              disabled={!selectedAccountId || selectedMinutes <= 0}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer"
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
          <div className="border-b border-[rgba(167,158,156,0.15)] pb-3">
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
          <GlassCard className="p-3.5 rounded-xl border border-[rgba(167,158,156,0.15)] text-xs text-mist space-y-1.5 max-w-sm mx-auto">
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
              className="h-11 rounded-xl text-xs bg-[rgba(61,77,85,0.4)] border border-[rgba(167,158,156,0.2)] text-sand cursor-pointer"
            >
              Quay lại
            </Button>

            <Button
              type="primary"
              loading={confirmingQr}
              onClick={handleConfirmQr}
              icon={<CheckCircle2 className="w-4 h-4 text-midnight" />}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer"
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

            <div className="flex items-center justify-between pb-3 border-b border-[rgba(167,158,156,0.15)] mb-3">
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
                <span>Khu vực áp dụng:</span>
                <strong className="text-sand">
                  Zone {selectedZone} ({new Intl.NumberFormat('vi-VN').format(pricePerHour)}đ/h)
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Thời gian nạp thêm:</span>
                <strong className="text-gold font-mono">
                  +{createdPurchase.minutes} phút (~{(createdPurchase.minutes / 60).toFixed(1)}h)
                </strong>
              </div>
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
              <div className="flex justify-between pt-2 border-t border-[rgba(167,158,156,0.1)] text-[11px]">
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
              className="h-11 rounded-xl text-xs bg-[rgba(61,77,85,0.4)] border border-[rgba(167,158,156,0.2)] text-sand hover:text-white cursor-pointer"
            >
              In biên lai
            </Button>

            <Button
              type="primary"
              onClick={onClose}
              className="h-11 rounded-xl text-xs bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold border-none shadow-[0_4px_16px_rgba(181,136,99,0.3)] cursor-pointer"
            >
              Hoàn tất
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
