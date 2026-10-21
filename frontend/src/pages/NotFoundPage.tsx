import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { Compass, Home, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PageTransition } from '@/components/animations/PageTransition';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStore();

  useDocumentTitle('404 • Không tìm thấy trang');

  const handleGoHome = () => {
    if (!isAuthenticated) {
      navigate('/customer/login');
      return;
    }

    switch (role) {
      case 'CUSTOMER':
        navigate('/customer/dashboard');
        break;
      case 'STAFF':
        navigate('/staff/dashboard');
        break;
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/customer/login');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full p-8 rounded-2xl bg-slate/50 border border-mist/20 shadow-2xl backdrop-blur-xl z-10 space-y-4">
          <div className="w-20 h-20 rounded-full bg-slate/70 border border-gold/40 text-gold flex items-center justify-center mx-auto shadow-inner animate-glow">
            <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '15s' }} />
          </div>

          <span className="text-6xl font-extrabold font-['Space_Grotesk'] text-gold tracking-tight block">
            404
          </span>

          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-sand">
            Trang Không Tồn Tại
          </h2>

          <p className="text-xs text-mist leading-relaxed max-w-xs mx-auto">
            Đường dẫn bạn vừa truy cập không tồn tại hoặc phiên chơi đã kết thúc.
          </p>

          <div className="pt-4 flex justify-center">
            <Button
              type="primary"
              size="large"
              icon={isAuthenticated ? <Home className="w-4 h-4 text-midnight" /> : <LogIn className="w-4 h-4 text-midnight" />}
              onClick={handleGoHome}
              className="h-12 px-6 font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 flex items-center justify-center gap-2"
            >
              {isAuthenticated ? 'QUAY VỀ BÀN CHƠI' : 'ĐĂNG NHẬP PHIÊN'}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFoundPage;
