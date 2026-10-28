import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input, Button, Tag, App } from 'antd';
import { Phone, Monitor, AlertTriangle, Sparkles as SparklesIcon, LogIn, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ZoneBadge } from '@/components/common/ZoneBadge';
import { PageTransition } from '@/components/animations/PageTransition';
import { Sparkles } from '@/components/animations/Sparkles';
import { authApi } from '@/api/authApi';
import { sessionApi } from '@/api/sessionApi';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ComputerCheckResponse } from '@/types/session';
import type { ErrorResponse } from '@/types/auth';

export const CustomerLoginPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setCustomerAuth = useAuthStore((state) => state.setCustomerAuth);

  useDocumentTitle('Đăng nhập máy trạm');

  // Lấy mã máy từ query param ?code=... hoặc máy đã lưu, mặc định PC-01
  const storedComputerCode = useAuthStore((s) => s.computerCode);
  const computerCode = searchParams.get('code') || storedComputerCode || 'PC-01';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingComputer, setCheckingComputer] = useState(false);
  const [computerInfo, setComputerInfo] = useState<ComputerCheckResponse | null>(null);
  const [computerError, setComputerError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Kiểm tra mã máy khi load trang
  useEffect(() => {
    if (!computerCode) return;

    let isMounted = true;
    setCheckingComputer(true);
    setComputerError(null);

    sessionApi
      .checkComputer(computerCode)
      .then((data) => {
        if (isMounted) {
          setComputerInfo(data);
        }
      })
      .catch((err: ErrorResponse) => {
        if (isMounted) {
          setComputerError(err.message || 'Mã máy trạm không hợp lệ');
        }
      })
      .finally(() => {
        if (isMounted) {
          setCheckingComputer(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [computerCode]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading || checkingComputer) return;

    if (!computerCode) {
      message.error('Vui lòng quét lại mã QR tại bàn để lấy mã máy!');
      triggerShake();
      return;
    }

    const trimmedPhone = phone.trim();
    // Validate định dạng số điện thoại (9 đến 11 chữ số bắt đầu bằng 0, chuẩn viễn thông & backend)
    const phoneRegex = /^0\d{8,10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      message.warning('Vui lòng nhập số điện thoại hợp lệ (9 đến 11 chữ số, ví dụ 0901234567)');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.customerSessionLogin({
        computerCode,
        phone: trimmedPhone,
      });

      // Lưu thông tin phiên và token vào Zustand store + storage
      setCustomerAuth(res);
      message.success(`Chào mừng ${res.account.name || 'bạn'} vào phiên chơi!`);
      navigate('/customer/dashboard', { replace: true });
    } catch (err: unknown) {
      triggerShake();
      const error = err as ErrorResponse;
      if (error?.errorCode === 'SESSION_NOT_ACTIVE') {
        message.error('Máy trạm này hiện chưa có phiên chơi hoạt động. Vui lòng liên hệ quầy thu ngân để mở máy!');
      } else if (error?.errorCode === 'FORBIDDEN') {
        message.error('Số điện thoại không khớp với người đang mở phiên máy này!');
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error('Đăng nhập thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
        {/* Background ambient light & sparkle dots */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-slate/40 rounded-full blur-[120px] pointer-events-none" />
        <Sparkles count={10} />

        {/* Brand & Title */}
        <div className="text-center mb-6 z-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate/70 border border-gold/30 mb-3 animate-glow">
            <SparklesIcon className="w-3.5 h-3.5 text-gold animate-sparkle" />
          <span className="text-[11px] uppercase tracking-widest text-gold font-semibold">
            CYBERNET VIP GAMING
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-sand font-['Space_Grotesk'] mb-1">
          CYBER<span className="text-gold">NET</span>
        </h1>
        <p className="text-xs sm:text-sm text-mist max-w-xs mx-auto">
          Cổng dịch vụ máy trạm & gọi món trực tiếp tại bàn
        </p>
      </div>

      {/* Main Form Container */}
      <div className={`w-full max-w-md z-10 ${shake ? 'animate-shake' : ''}`}>
        <GlassCard elevated className="border-mist/20 backdrop-blur-xl">
          {/* Machine Code Badge Display */}
          <div className="mb-6 p-3.5 rounded-lg bg-midnight/80 border border-mist/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-slate text-gold border border-gold/20">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-mist uppercase tracking-wider block font-medium">
                  Máy trạm hiện tại
                </span>
                <span className="text-lg font-bold text-sand font-['Space_Grotesk'] tracking-wide">
                  {computerCode ? computerCode.toUpperCase() : 'Chưa quét QR'}
                </span>
              </div>
            </div>

            {computerCode ? (
              checkingComputer ? (
                <Tag color="default" className="text-xs">Đang kiểm tra...</Tag>
              ) : computerError ? (
                <Tag color="error" className="text-xs">Lỗi mã máy</Tag>
              ) : (
                <ZoneBadge zone={computerInfo?.zone} size="sm" />
              )
            ) : (
              <Tag color="warning" className="text-xs">Thiếu mã máy</Tag>
            )}
          </div>

          {/* Missing Code Warning Alert */}
          {!computerCode && (
            <div className="mb-5 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2.5 text-warning text-xs leading-relaxed animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Không tìm thấy mã máy trạm!</strong>
                Vui lòng dùng điện thoại quét mã QR dán trên bàn máy của bạn để tiếp tục (URL có dạng <code className="bg-black/30 px-1 py-0.5 rounded">?code=PC-01</code>).
              </div>
            </div>
          )}

          {/* Computer Error Alert */}
          {computerError && (
            <div className="mb-5 p-3 rounded-lg bg-danger/10 border border-danger/30 flex items-start gap-2.5 text-danger text-xs leading-relaxed animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Cảnh báo:</strong>
                {computerError}. Vui lòng kiểm tra lại mã máy hoặc liên hệ thu ngân.
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customer-phone" className="block text-xs font-semibold uppercase tracking-wider text-sand/80 mb-2">
                Số điện thoại của bạn
              </label>
              <Input
                id="customer-phone"
                size="large"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                prefix={<Phone className="w-4 h-4 text-mist mr-1" />}
                placeholder="Nhập số điện thoại (VD: 0901234567)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="bg-midnight/70 text-sand border-mist/30 hover:border-gold/60 focus:border-gold h-12 text-base font-medium rounded-lg"
                autoComplete="tel"
                autoFocus
              />
              <span className="text-[11px] text-mist/70 mt-1.5 block">
                * Chỉ cần nhập SĐT phiên đang ngồi, không cần mật khẩu.
              </span>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              disabled={!computerCode || checkingComputer || loading}
              className="w-full h-12 mt-2 text-base font-bold bg-gold hover:bg-gold-light active:bg-gold-dark text-midnight rounded-lg border-0 shadow-lg shadow-gold/20 transition-all duration-300"
            >
              {loading ? (
                'ĐANG VÀO PHIÊN...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5 text-midnight shrink-0" />
                  <span>VÀO PHIÊN CHƠI</span>
                  <ArrowRight className="w-4 h-4 text-midnight shrink-0" />
                </span>
              )}
            </Button>
          </form>
        </GlassCard>

        {/* Quick Help Footer */}
        <p className="text-center text-xs text-mist/60 mt-6">
          Chưa có tài khoản hoặc chưa nạp giờ? Vui lòng gặp thu ngân tại quầy.
        </p>
      </div>
    </div>
  </PageTransition>
);
};

export default CustomerLoginPage;
