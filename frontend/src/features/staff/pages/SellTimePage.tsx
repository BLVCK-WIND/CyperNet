import React, { useState } from 'react';
import {
  Select,
  Button,
  Tag,
  Skeleton,
  InputNumber,
  App,
  Modal,
} from 'antd';
import {
  Coins,
  QrCode,
  Banknote,
  User,
  RefreshCw,
  Monitor,
  Calendar,
  Check,
  X,
  UserPlus,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { accountApi } from '@/api/accountApi';
import { timePurchaseApi } from '@/api/timePurchaseApi';
import { sessionApi } from '@/api/sessionApi';
import { orderApi } from '@/api/orderApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { RegisterCustomerModal } from '../components/RegisterCustomerModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Account } from '@/types/auth';
import type { TimePurchaseResponse, PaymentMethod } from '@/types/timePurchase';
import type { VietQrResponse } from '@/types/order';
import type { SessionResponse } from '@/types/auth';

dayjs.extend(relativeTime);
dayjs.locale('vi');

// Các mệnh giá nạp tiền mặt phổ biến
const PRESET_AMOUNTS = [
  { amount: 10000, label: '10.000 đ' },
  { amount: 20000, label: '20.000 đ' },
  { amount: 50000, label: '50.000 đ', isPopular: true },
  { amount: 100000, label: '100.000 đ' },
  { amount: 200000, label: '200.000 đ' },
  { amount: 500000, label: '500.000 đ' },
];

export const SellTimePage: React.FC = () => {
  useDocumentTitle('Bán giờ chơi (Sell Time POS) • CyberNet');
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(300); // 50.000 / 10.000 * 60 = 300p
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<TimePurchaseResponse | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);
  const [confirmingQr, setConfirmingQr] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // 1. Lấy danh sách khách hàng (role: CUSTOMER)
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['staff-customer-accounts'],
    queryFn: () => accountApi.getAccounts({ role: 'CUSTOMER', size: 100 }),
  });

  // 2. Lấy danh sách các phiên chơi đang ACTIVE để phát hiện máy khách đang ngồi
  const { data: activeSessionsData } = useQuery({
    queryKey: ['staff-active-sessions-lookup'],
    queryFn: () => sessionApi.getSessions({ status: 'ACTIVE', size: 100 }),
    refetchInterval: 10000,
  });

  // 3. Lấy lịch sử giao dịch nạp giờ gần nhất (10 giao dịch mới nhất)
  const {
    data: timePurchasesData,
    isLoading: isLoadingPurchases,
    isFetching: isFetchingPurchases,
    refetch: refetchPurchases,
  } = useQuery({
    queryKey: ['staff-recent-time-purchases'],
    queryFn: () => timePurchaseApi.getTimePurchases({ size: 10, sort: 'createdAt,desc' }),
    refetchInterval: 10000,
  });

  const accounts: Account[] = accountsData?.content || [];
  const activeSessions: SessionResponse[] = activeSessionsData?.content || [];
  const recentPurchases: TimePurchaseResponse[] = timePurchasesData?.content || [];

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // Kiểm tra xem khách hàng này có đang ngồi ở máy nào không
  const activeSessionOfCustomer = selectedAccount
    ? activeSessions.find(
        (s) => s.accountId === selectedAccount.id || s.accountPhone === selectedAccount.phone
      )
    : null;

  // Đơn giá giờ chuẩn (10.000đ/h làm mốc Standard)
  const basePricePerHour = 10000;

  // Định dạng số phút sang chuỗi "X giờ Y phút"
  const formatMinutes = (totalMinutes: number) => {
    if (totalMinutes <= 0) return '0 phút';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} phút`;
    if (mins === 0) return `${hours} giờ`;
    return `${hours} giờ ${mins} phút`;
  };

  // Chọn mệnh giá nạp nhanh
  const handleSelectPreset = (amt: number) => {
    setIsCustomAmount(false);
    setSelectedAmount(amt);
    const calculatedMinutes = Math.round((amt / basePricePerHour) * 60);
    setSelectedMinutes(calculatedMinutes);
  };

  // Thay đổi số tiền tùy ý
  const handleCustomAmountChange = (value: number | null) => {
    const amt = value || 0;
    setSelectedAmount(amt);
    const calculatedMinutes = Math.round((amt / basePricePerHour) * 60);
    setSelectedMinutes(calculatedMinutes);
  };

  // Thay đổi số phút tùy ý
  const handleCustomMinutesChange = (value: number | null) => {
    const mins = value || 0;
    setSelectedMinutes(mins);
    const calculatedAmount = Math.round((mins / 60) * basePricePerHour);
    setSelectedAmount(calculatedAmount);
  };

  // Xử lý tạo và xác nhận nạp giờ
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
        // Thu tiền mặt: Tự động xác nhận nạp vào tài khoản
        const confirmed = await timePurchaseApi.confirmTimePurchase(newPurchase.id);

        message.success(
          `Đã nạp thành công ${formatMinutes(confirmed.minutes)} (${new Intl.NumberFormat(
            'vi-VN',
            { style: 'currency', currency: 'VND' }
          ).format(confirmed.amount)}) cho khách ${selectedAccount?.name}!`
        );

        // Làm mới cache tài khoản, sơ đồ máy và lịch sử nạp
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
          queryClient.invalidateQueries({ queryKey: ['staff-recent-time-purchases'] }),
          queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
          queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
        ]);

        // Reset về mặc định
        setSelectedAmount(50000);
        setSelectedMinutes(300);
      } else {
        // VietQR: Sinh mã QR động Napas247
        const qr = await orderApi.generateVietQR(
          selectedAmount,
          `NAPGIO ${newPurchase.id} ${selectedAccount?.phone || ''}`
        );
        setCreatedPurchase(newPurchase);
        setVietQrData(qr);
        setQrModalOpen(true);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể tạo phiếu nạp giờ lúc này!');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận nạp tiền sau khi khách quét mã VietQR thành công
  const handleConfirmQrPayment = async () => {
    if (!createdPurchase) return;
    setConfirmingQr(true);
    try {
      const confirmed = await timePurchaseApi.confirmTimePurchase(createdPurchase.id);
      message.success(
        `Đã nhận thanh toán VietQR và nạp ${formatMinutes(confirmed.minutes)} cho ${selectedAccount?.name}!`
      );
      setQrModalOpen(false);
      setCreatedPurchase(null);
      setVietQrData(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-recent-time-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
      ]);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể xác nhận giao dịch QR!');
    } finally {
      setConfirmingQr(false);
    }
  };

  // Duyệt nhanh một phiếu nạp pending từ bảng lịch sử
  const handleQuickConfirm = async (purchaseId: number) => {
    setActionInProgressId(purchaseId);
    try {
      await timePurchaseApi.confirmTimePurchase(purchaseId);
      message.success(`Đã duyệt thành công giao dịch nạp giờ #${purchaseId}!`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-customer-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-recent-time-purchases'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-floormap-data'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-quick-status-stats'] }),
      ]);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Lỗi khi duyệt giao dịch!');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Hủy giao dịch nạp pending
  const handleQuickCancel = async (purchaseId: number) => {
    setActionInProgressId(purchaseId);
    try {
      await timePurchaseApi.cancelTimePurchase(purchaseId);
      message.info(`Đã hủy giao dịch nạp giờ #${purchaseId}`);
      queryClient.invalidateQueries({ queryKey: ['staff-recent-time-purchases'] });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      message.error(errorObj.response?.data?.message || 'Không thể hủy giao dịch!');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header Trang POS Bán Giờ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-sand flex items-center gap-2.5">
            <Coins className="w-6 h-6 text-gold" />
            Bán giờ chơi (Sell Time POS)
          </h1>
          <p className="text-xs text-mist mt-1">
            Nạp giờ chơi cho tài khoản hội viên, hỗ trợ thanh toán Tiền mặt & VietQR Napas247 tại quầy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<RefreshCw className={`w-4 h-4 text-gold ${isFetchingPurchases ? 'animate-spin' : ''}`} />}
            onClick={() => refetchPurchases()}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl twinkle-btn-secondary cursor-pointer"
          >
            <span className="text-xs font-medium">Làm mới dữ liệu</span>
          </Button>
        </div>
      </div>

      {/* 2. Bố cục 2 Cột: Quầy Nạp Giờ (Trái) & Lịch Sử Giao Dịch (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= CỘT TRÁI: FORM NẠP GIỜ TRỰC TIẾP (7/12) ================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <GlassCard className="p-6 rounded-2xl border border-mist/20 twinkle-card-flow">
            {/* Tiêu đề & Nút đăng ký hội viên mới */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-mist/15">
              <h2 className="text-base font-bold text-sand flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                1. Chọn tài khoản khách hàng
              </h2>

              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className="text-xs font-bold text-gold hover:text-gold-light flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Đăng ký hội viên mới</span>
              </button>
            </div>

            {/* Ô tìm kiếm khách hàng */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-mist block">
                Tìm kiếm theo Số điện thoại hoặc Tên khách hàng:
              </label>
              <Select
                showSearch
                value={selectedAccountId}
                placeholder="Nhập số điện thoại khách hàng (VD: 0912..., 0988...)"
                loading={isLoadingAccounts}
                onChange={(val) => setSelectedAccountId(val)}
                filterOption={(input, option) =>
                  String(option?.label || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={accounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.phone} — ${acc.name} (${acc.remainingMinutes} phút)`,
                }))}
                className="w-full h-11"
                popupClassName="bg-midnight border border-gold/30 rounded-xl"
              />

              {/* Thông tin thẻ hội viên sau khi chọn */}
              {selectedAccount ? (
                <div className="p-4 rounded-xl bg-midnight/70 border border-gold/30 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold font-mono text-base border border-gold/30 shrink-0">
                      {selectedAccount.name?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sand text-sm">{selectedAccount.name}</span>
                        <Tag className="m-0 bg-gold/15 text-gold border-gold/30 text-[10px] font-semibold rounded-full px-2">
                          HỘI VIÊN
                        </Tag>
                      </div>
                      <span className="text-xs font-mono text-mist block">{selectedAccount.phone}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <span className="text-[11px] text-mist">Số dư giờ chơi hiện có:</span>
                    <span className="font-heading font-black text-lg text-gold font-mono">
                      {formatMinutes(selectedAccount.remainingMinutes)}
                    </span>
                    {activeSessionOfCustomer ? (
                      <span className="text-[11px] font-semibold text-[#85C1DC] flex items-center gap-1 mt-0.5">
                        <Monitor className="w-3 h-3" />
                        Đang chơi tại máy: <strong>{activeSessionOfCustomer.computerCode}</strong>
                      </span>
                    ) : (
                      <span className="text-[11px] text-mist/60 italic">Chưa mở máy</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Gói nạp & Mệnh giá tiền */}
            <div className="mt-6 pt-5 border-t border-mist/15">
              <h2 className="text-base font-bold text-sand flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-gold" />
                2. Chọn mệnh giá nạp tiền
              </h2>

              {/* Grid nút chọn mệnh giá nhanh */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                {PRESET_AMOUNTS.map((preset) => {
                  const isSelected = !isCustomAmount && selectedAmount === preset.amount;
                  return (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => handleSelectPreset(preset.amount)}
                      className={`relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-gold bg-gold/15 shadow-[0_0_16px_rgba(189,152,117,0.3)] ring-1 ring-gold'
                          : 'border-mist/20 bg-midnight/60 hover:border-gold/50 hover:bg-gold/10'
                      }`}
                    >
                      {preset.isPopular ? (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-gold text-midnight text-[9px] font-extrabold uppercase">
                          PHỔ BIẾN
                        </span>
                      ) : null}
                      <span className="block font-heading font-extrabold text-sm text-sand">
                        {preset.label}
                      </span>
                      <span className="block text-[11px] font-mono text-mist mt-0.5">
                        = {formatMinutes(Math.round((preset.amount / basePricePerHour) * 60))}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tùy chọn nhập số tiền / số phút tùy ý */}
              <div className="p-3.5 rounded-xl bg-midnight/50 border border-mist/15">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-mist">
                    Hoặc nhập số tiền / số phút tùy chỉnh:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomAmount(!isCustomAmount)}
                    className="text-xs text-gold hover:underline cursor-pointer"
                  >
                    {isCustomAmount ? 'Dùng gói gợi ý' : 'Nhập tự do'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-mist block mb-1">Số tiền thanh toán (VNĐ):</label>
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
                      className="w-full rounded-xl bg-midnight border-mist/25 text-sand h-10 flex items-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-mist block mb-1">Quy đổi số phút nạp:</label>
                    <InputNumber
                      min={1}
                      step={15}
                      value={selectedMinutes}
                      onChange={(val) => {
                        setIsCustomAmount(true);
                        handleCustomMinutesChange(val);
                      }}
                      className="w-full rounded-xl bg-midnight border-mist/25 text-sand h-10 flex items-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng tổng kết quy đổi minh bạch */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-gold/15 via-slate/40 to-gold/10 border border-gold/30">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-mist/15">
                <span className="text-mist">Đơn giá cơ sở:</span>
                <span className="text-sand font-mono font-semibold">10.000 đ = 60 phút Standard</span>
              </div>

              <div className="flex items-center justify-between pt-2.5">
                <div>
                  <span className="text-xs text-mist block">Khách được cộng thêm:</span>
                  <span className="font-heading font-black text-xl text-gold font-mono">
                    +{formatMinutes(selectedMinutes)}
                  </span>
                  <span className="text-[11px] text-mist/70 block">
                    (Tương đương {Math.round(selectedMinutes / 2)} phút nếu chơi máy VIP 20k)
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-mist block">Tổng tiền thu:</span>
                  <span className="font-heading font-black text-xl text-sand font-mono">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      selectedAmount
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Phương thức thanh toán & Nút xác nhận */}
            <div className="mt-6 pt-5 border-t border-mist/15">
              <label className="text-xs font-semibold text-mist block mb-2.5">
                3. Chọn hình thức thu tiền:
              </label>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'border-gold bg-gold/15 text-gold ring-1 ring-gold shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                      : 'border-mist/20 bg-midnight/50 text-mist hover:text-sand'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Tiền mặt tại quầy (CASH)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all cursor-pointer ${
                    paymentMethod === 'QR'
                      ? 'border-gold bg-gold/15 text-gold ring-1 ring-gold shadow-[0_0_12px_rgba(189,152,117,0.3)]'
                      : 'border-mist/20 bg-midnight/50 text-mist hover:text-sand'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Chuyển khoản VietQR (QR)
                </button>
              </div>

              {/* Nút bấm Submit */}
              <Button
                type="primary"
                size="large"
                loading={submitting}
                onClick={handleCreatePurchase}
                disabled={!selectedAccountId || selectedAmount <= 0}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold text-sm tracking-wide border-none shadow-[0_4px_20px_rgba(189,152,117,0.35)] cursor-pointer"
              >
                {paymentMethod === 'CASH' ? 'THU TIỀN MẶT & NẠP GIỜ NGAY' : 'TẠO MÃ VIETQR THANH TOÁN'}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* ================= CỘT PHẢI: LỊCH SỬ GIAO DỊCH NẠP GIỜ (5/12) ================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <GlassCard className="p-5 rounded-2xl border border-mist/20 twinkle-card-flow">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-mist/15">
              <h2 className="text-sm font-bold text-sand flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                Lịch sử nạp giờ gần đây
              </h2>
              <span className="text-[11px] font-mono text-mist">
                {recentPurchases.length} phiếu mới nhất
              </span>
            </div>

            {isLoadingPurchases ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-midnight/40 border border-mist/10">
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                ))}
              </div>
            ) : recentPurchases.length === 0 ? (
              <div className="py-10 text-center">
                <Coins className="w-10 h-10 text-mist/30 mx-auto mb-2" />
                <p className="text-xs text-mist">Chưa có giao dịch nạp giờ nào hôm nay</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                {recentPurchases.map((purchase) => {
                  const isPending = purchase.status === 'PENDING_PAYMENT';
                  const isConfirmed = purchase.status === 'CONFIRMED';

                  return (
                    <div
                      key={purchase.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isPending
                          ? 'border-warning/50 bg-warning/5'
                          : isConfirmed
                          ? 'border-mist/15 bg-midnight/60'
                          : 'border-danger/30 bg-danger/5 opacity-60'
                      }`}
                    >
                      {/* Dòng 1: Mã phiếu, Thời gian & Status Tag */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-mono font-bold text-sand">
                          #TP-{purchase.id}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-mist font-mono">
                            {dayjs(purchase.createdAt).fromNow()}
                          </span>
                          {isConfirmed ? (
                            <Tag className="m-0 bg-success/15 text-success border-success/30 text-[10px] font-bold rounded-full px-2">
                              ĐÃ NẠP
                            </Tag>
                          ) : isPending ? (
                            <Tag className="m-0 bg-warning/20 text-warning border-warning/40 text-[10px] font-bold rounded-full px-2 animate-pulse">
                              CHỜ TIỀN
                            </Tag>
                          ) : (
                            <Tag className="m-0 bg-danger/15 text-danger border-danger/30 text-[10px] font-bold rounded-full px-2">
                              HỦY
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* Dòng 2: Tên khách & SĐT */}
                      <div className="flex items-center justify-between gap-2 text-xs text-sand font-medium">
                        <span className="truncate">{purchase.accountName || 'Khách vãng lai'}</span>
                        <span className="font-mono text-mist text-[11px] shrink-0">
                          {purchase.accountPhone}
                        </span>
                      </div>

                      {/* Dòng 3: Số tiền & Số phút */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-mist/15">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-mist">{purchase.paymentMethod === 'QR' ? '📱 VietQR' : '💵 Tiền mặt'}:</span>
                          <span className="font-bold font-mono text-gold">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(purchase.amount)}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-extrabold text-[#4ADE80]">
                          +{formatMinutes(purchase.minutes)}
                        </span>
                      </div>

                      {/* Nếu đơn PENDING: Hiển thị 2 nút Duyệt / Hủy nhanh */}
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-warning/20">
                          <Button
                            size="small"
                            danger
                            icon={<X className="w-3.5 h-3.5" />}
                            loading={actionInProgressId === purchase.id}
                            onClick={() => handleQuickCancel(purchase.id)}
                            className="rounded-lg text-[11px] h-7"
                          >
                            Hủy
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            icon={<Check className="w-3.5 h-3.5" />}
                            loading={actionInProgressId === purchase.id}
                            onClick={() => handleQuickConfirm(purchase.id)}
                            className="rounded-lg text-[11px] h-7 bg-gold text-midnight border-none font-bold"
                          >
                            Xác nhận thu tiền
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* 3. Modal Quét Mã VietQR Napas247 Động */}
      <Modal
        open={qrModalOpen}
        onCancel={() => {
          setQrModalOpen(false);
          setCreatedPurchase(null);
          setVietQrData(null);
        }}
        footer={null}
        centered
        width={420}
        styles={{
          body: {
            backgroundColor: '#202332',
            borderRadius: '20px',
            padding: '12px',
          },
        }}
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-gold font-bold text-base">
            <QrCode className="w-5 h-5" />
            Mã VietQR Thanh Toán
          </div>

          <p className="text-xs text-mist">
            Yêu cầu khách hàng mở App Ngân hàng bất kỳ hoặc Ví điện tử quét mã bên dưới để nạp giờ:
          </p>

          {/* Khung ảnh QR Code */}
          <div className="p-3 bg-white rounded-2xl inline-block shadow-[0_0_24px_rgba(189,152,117,0.3)]">
            {vietQrData?.qrUrl ? (
              <img
                src={vietQrData.qrUrl}
                alt="VietQR Napas247"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-gray-100 text-gray-500 text-xs">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          {/* Chi tiết chuyển khoản */}
          <div className="p-3 rounded-xl bg-midnight/80 border border-mist/15 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-mist">Số tiền nạp:</span>
              <span className="font-mono font-bold text-gold text-sm">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  selectedAmount
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist">Thời gian quy đổi:</span>
              <span className="font-mono text-sand font-bold">+{formatMinutes(selectedMinutes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mist">Khách hàng:</span>
              <span className="text-sand">{selectedAccount?.name} ({selectedAccount?.phone})</span>
            </div>
          </div>

          {/* Nút hoàn tất */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => setQrModalOpen(false)}
              className="flex-1 h-10 rounded-xl bg-transparent border-mist/20 text-mist hover:text-sand"
            >
              Đóng lại
            </Button>
            <Button
              type="primary"
              loading={confirmingQr}
              onClick={handleConfirmQrPayment}
              className="flex-1 h-10 rounded-xl bg-gold text-midnight font-bold border-none shadow-[0_2px_12px_rgba(189,152,117,0.3)]"
            >
              Đã nhận tiền (Xác nhận)
            </Button>
          </div>
        </div>
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
    </div>
  );
};
