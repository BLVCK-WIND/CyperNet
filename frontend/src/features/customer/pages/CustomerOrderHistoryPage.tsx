import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Skeleton, App } from 'antd';
import {
  ArrowLeft,
  ReceiptText,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { orderApi } from '@/api/orderApi';
import { useAuthStore } from '@/store/authStore';
import { OrderCard } from '../components/OrderCard';
import { OrderDetailDrawer } from '../components/OrderDetailDrawer';
import { QrPaymentModal } from '../components/QrPaymentModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTransition } from '@/components/animations/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { OrderResponse, VietQrResponse } from '@/types/order';

export const CustomerOrderHistoryPage: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { sessionId, isAuthenticated } = useAuthStore();

  useDocumentTitle('Lịch sử đơn hàng');

  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [qrModalOrder, setQrModalOrder] = useState<OrderResponse | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrResponse | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [loadingQrOrderId, setLoadingQrOrderId] = useState<number | null>(null);

  // Tra cứu đơn hàng theo phiên chơi, polling tự động mỗi 10 giây
  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['session-orders', sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error('Không có mã phiên hoạt động');
      }
      return orderApi.getOrdersBySession(sessionId, { page: 0, size: 30 });
    },
    enabled: Boolean(sessionId && isAuthenticated),
    refetchInterval: 10000, // Polling định kỳ 10 giây cập nhật trạng thái đơn
  });

  const orders: OrderResponse[] = pageData?.content || [];

  const handleOpenQr = async (order: OrderResponse) => {
    if (loadingQrOrderId) return;
    setLoadingQrOrderId(order.id);
    try {
      const qrData = await orderApi.generateVietQR(
        order.totalAmount,
        `ORDER-CYBERNET-${order.id}`
      );
      setQrModalOrder(order);
      setVietQrData(qrData);
      setIsQrModalOpen(true);
    } catch {
      message.error('Không thể tạo mã VietQR. Vui lòng thử lại!');
    } finally {
      setLoadingQrOrderId(null);
    }
  };

  const handleViewDetail = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-midnight via-midnight to-obsidian text-sand flex flex-col justify-between selection:bg-gold selection:text-midnight">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 glass-panel border-b border-mist/15 px-4 sm:px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeft className="w-5 h-5 text-sand" />}
              onClick={() => navigate('/customer/dashboard')}
              className="hover:bg-slate/60 text-sand flex items-center justify-center"
              aria-label="Quay lại Dashboard"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Space_Grotesk'] text-sand m-0">
                Đơn Hàng <span className="text-gold">Của Tôi</span>
              </h1>
              <span className="text-[11px] text-mist block">
                Phiên #{sessionId || 'N/A'} • Tự động cập nhật trạng thái
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="text"
              size="small"
              icon={
                <RefreshCw
                  className={`w-4 h-4 text-mist ${isFetching ? 'animate-spin text-gold' : ''}`}
                />
              }
              onClick={() => refetch()}
              className="text-xs text-mist hover:text-gold"
              title="Làm mới danh sách"
            />
            <Button
              type="primary"
              size="small"
              icon={<Plus className="w-3.5 h-3.5 text-midnight" />}
              onClick={() => navigate('/customer/menu')}
              className="bg-gold hover:bg-gold-light text-midnight font-bold border-0 text-xs px-3 rounded-lg"
            >
              Gọi thêm
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4 pb-20">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <GlassCard key={idx} className="p-4 rounded-xl">
                <Skeleton active paragraph={{ rows: 2 }} />
              </GlassCard>
            ))}
          </div>
        ) : isError ? (
          <GlassCard elevated className="text-center py-12 border-danger/30">
            <p className="text-danger font-semibold mb-2">Không thể tải lịch sử đơn hàng!</p>
            <p className="text-xs text-mist mb-4">Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.</p>
            <Button
              type="primary"
              icon={<RefreshCw className="w-4 h-4 mr-1" />}
              onClick={() => refetch()}
              className="bg-gold text-midnight border-0"
            >
              Thử lại
            </Button>
          </GlassCard>
        ) : orders.length === 0 ? (
          <GlassCard className="text-center py-16 border-mist/15">
            <div className="w-16 h-16 rounded-full bg-slate/50 text-mist flex items-center justify-center mx-auto mb-3 border border-mist/20">
              <ReceiptText className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-base font-semibold text-sand mb-1">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-xs text-mist max-w-xs mx-auto mb-6">
              Bạn chưa đặt món ăn hay nước uống nào trong phiên chơi này.
            </p>
            <Button
              type="primary"
              size="large"
              icon={<Plus className="w-4 h-4 text-midnight" />}
              onClick={() => navigate('/customer/menu')}
              className="font-bold bg-gold hover:bg-gold-light text-midnight rounded-xl border-0 shadow-lg shadow-gold/20 px-6 h-11"
            >
              ĐẶT MÓN NGAY
            </Button>
          </GlassCard>
        ) : (
          <StaggerContainer className="space-y-3.5">
            {orders.map((order) => (
              <StaggerItem key={order.id}>
                <OrderCard
                  order={order}
                  onViewDetail={handleViewDetail}
                  onOpenQr={handleOpenQr}
                  isLoadingQr={loadingQrOrderId === order.id}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>

      {/* 3. DRAWERS & MODALS */}
      <OrderDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        onOpenQr={handleOpenQr}
        isLoadingQr={loadingQrOrderId === selectedOrder?.id}
      />

      <QrPaymentModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        order={qrModalOrder}
        vietQr={vietQrData}
        onConfirmPaid={() => {
          setIsQrModalOpen(false);
          refetch();
        }}
      />

      {/* 4. FOOTER (Desktop only) */}
      <footer className="hidden sm:block py-4 text-center text-xs text-mist/60 border-t border-mist/10 mt-auto bg-midnight/80">
        CyberNet Order Service • Quản lý đơn hàng theo phiên chơi
      </footer>
    </div>
  </PageTransition>
  );
};

export default CustomerOrderHistoryPage;
