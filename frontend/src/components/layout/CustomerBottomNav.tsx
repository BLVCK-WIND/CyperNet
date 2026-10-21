import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from 'antd';
import { LayoutDashboard, UtensilsCrossed, ReceiptText } from 'lucide-react';
import { orderApi } from '@/api/orderApi';
import { useAuthStore } from '@/store/authStore';

export const CustomerBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useAuthStore();

  // Tra cứu số lượng đơn hàng chờ xử lý trong phiên để hiện badge
  const { data: ordersPage } = useQuery({
    queryKey: ['session-orders', sessionId],
    queryFn: () => orderApi.getOrdersBySession(sessionId!),
    enabled: Boolean(sessionId),
    refetchInterval: 15000,
  });

  const pendingCount = useMemo(() => {
    return (
      ordersPage?.content?.filter((o) => o.status === 'PENDING_PAYMENT')
        .length || 0
    );
  }, [ordersPage]);

  const navItems = [
    {
      label: 'Phiên chơi',
      path: '/customer/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Gọi món',
      path: '/customer/menu',
      icon: UtensilsCrossed,
    },
    {
      label: 'Đơn hàng',
      path: '/customer/orders',
      icon: ReceiptText,
      badge: pendingCount,
    },
  ];

  return (
    <nav
      aria-label="Điều hướng di động"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-midnight/90 backdrop-blur-xl border-t border-mist/20 py-1.5 px-3 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          const buttonContent = (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-gold'
                  : 'text-mist/70 hover:text-sand'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(181,136,99,0.5)]' : ''
                  }`}
                />
              </div>

              <span
                className={`text-[10px] mt-1 font-medium tracking-tight ${
                  isActive ? 'font-bold text-gold' : 'text-mist'
                }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-gold mt-0.5 animate-glow" />
              )}
            </button>
          );

          if (item.badge && item.badge > 0) {
            return (
              <Badge
                key={item.path}
                count={item.badge}
                overflowCount={99}
                color="#F59E0B"
                offset={[-4, 4]}
              >
                {buttonContent}
              </Badge>
            );
          }

          return buttonContent;
        })}
      </div>
    </nav>
  );
};

export default CustomerBottomNav;
