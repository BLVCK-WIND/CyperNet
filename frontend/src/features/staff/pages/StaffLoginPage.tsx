import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Tag, App } from 'antd';
import { Phone, Lock, ShieldCheck, LogIn, Sparkles as SparklesIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTransition } from '@/components/animations/PageTransition';
import { Sparkles } from '@/components/animations/Sparkles';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ErrorResponse } from '@/types/auth';

export const StaffLoginPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const setStaffAuth = useAuthStore((state) => state.setStaffAuth);

  useDocumentTitle('Đăng nhập ca trực nhân viên • CyberNet');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      message.warning('Vui lòng nhập số điện thoại!');
      triggerShake();
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      message.warning('Số điện thoại phải gồm 10 chữ số (ví dụ 0902222222)!');
      triggerShake();
      return;
    }

    if (!password) {
      message.warning('Vui lòng nhập mật khẩu tài khoản!');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        phone: trimmedPhone,
        password,
      });

      // Kiểm tra vai trò: Chỉ chấp nhận STAFF hoặc ADMIN
      if (res.account.role !== 'STAFF' && res.account.role !== 'ADMIN') {
        message.error('Tài khoản của bạn là Khách hàng, không có quyền truy cập ca trực nhân viên!');
        triggerShake();
        return;
      }

      // Lưu xác thực ca trực vào Zustand store + localStorage
      setStaffAuth(res);
      message.success(`Chào mừng ${res.account.name || 'Nhân viên'} vào ca trực!`);
      navigate('/staff/floormap', { replace: true });
    } catch (err: unknown) {
      triggerShake();
      const apiErr = err as ErrorResponse;
      if (apiErr.status === 401) {
        message.error('Số điện thoại hoặc mật khẩu không chính xác!');
      } else if (apiErr.status === 429) {
        message.error('Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ 60 giây!');
      } else {
        message.error(apiErr.message || 'Đăng nhập ca trực thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-midnight via-midnight to-obsidian overflow-hidden select-none">
      {/* Hiệu ứng hạt bụi vàng CyberLux lơ lửng */}
      <Sparkles count={25} />

      {/* Hiệu ứng hào quang nền mờ trung tâm */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(181,136,99,0.12)_0%,transparent_70%)] pointer-events-none blur-2xl" />

      <PageTransition className="w-full max-w-md z-10">
        <GlassCard
          className={`p-8 border border-[rgba(167,158,156,0.18)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-transform duration-300 ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {/* 1. Header: Logo CyberNet & Huy hiệu Nhân Viên */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dark text-midnight shadow-[0_0_24px_rgba(181,136,99,0.4)] mb-4">
              <ShieldCheck className="w-8 h-8 text-midnight" />
            </div>

            <h1 className="font-heading font-extrabold text-3xl tracking-wider text-sand mb-2">
              CYBER<span className="text-gold">NET</span>
            </h1>

            <div className="flex items-center justify-center gap-2">
              <Tag
                bordered={false}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[rgba(181,136,99,0.15)] text-gold border border-[rgba(181,136,99,0.35)] shadow-[0_0_12px_rgba(181,136,99,0.15)] inline-flex items-center gap-1.5"
              >
                <SparklesIcon className="w-3 h-3 text-gold" />
                NHÂN VIÊN QUẦY • POS CONSOLE
              </Tag>
            </div>
          </div>

          {/* 2. Form Đăng Nhập Ca Trực */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Số điện thoại */}
            <div>
              <label className="block text-xs font-medium text-mist mb-2">
                Số điện thoại tài khoản nhân viên
              </label>
              <Input
                size="large"
                prefix={<Phone className="w-4 h-4 text-mist mr-1" />}
                placeholder="Ví dụ: 0902222222"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                maxLength={10}
                className="bg-midnight/70 border-[rgba(167,158,156,0.2)] text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-12"
              />
            </div>

            {/* Input Mật khẩu */}
            <div>
              <label className="block text-xs font-medium text-mist mb-2">
                Mật khẩu ca trực
              </label>
              <Input.Password
                size="large"
                prefix={<Lock className="w-4 h-4 text-mist mr-1" />}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-midnight/70 border-[rgba(167,158,156,0.2)] text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-12"
              />
            </div>

            {/* Nút Đăng nhập Submit */}
            <div className="pt-2">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={!loading && <LogIn className="w-4 h-4" />}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-midnight font-bold tracking-wide shadow-[0_4px_20px_rgba(181,136,99,0.3)] transition-all duration-300 border-none cursor-pointer"
              >
                {loading ? 'ĐANG XÁC THỰC CA TRỰC...' : 'VÀO CA LÀM VIỆC'}
              </Button>
            </div>
          </form>

          {/* 3. Footer Ghi chú an toàn */}
          <div className="mt-8 pt-4 border-t border-[rgba(167,158,156,0.1)] text-center">
            <p className="text-[11px] text-mist/70">
              Khu vực bảo mật nội bộ phòng máy CyberNet • Đăng nhập được ghi nhật ký hệ thống (Audit Trail).
            </p>
          </div>
        </GlassCard>
      </PageTransition>
    </div>
  );
};
