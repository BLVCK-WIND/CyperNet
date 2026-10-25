import React, { useState } from 'react';
import { Input, Button, Skeleton, Segmented, Badge, App } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  ReceiptText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StaffOrderCard } from '../components/StaffOrderCard';
import { StaffOrderDetailDrawer } from '../components/StaffOrderDetailDrawer';
import { useOrderQueue, type OrderQueueTab } from '../hooks/useOrderQueue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse } from '@/types/order';

export const StaffOrderQueuePage: React.FC = () => {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  useDocumentTitle('Hàng đợi đơn hàng (Order Queue) • CyberNet');

  const [statusTab, setStatusTab] = useState<OrderQueueTab>('PENDING_PAYMENT');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'confirm' | 'cancel' | null>(null);

  const {
    orders,
    pendingCount,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useOrderQueue({
    statusTab,
    searchKeyword,
  });

  const handleViewDetail = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleConfirmOrder = async (order: OrderResponse) => {
    try {
      setProcessingOrderId(order.id);
      setProcessingAction('confirm');
      const updatedOrder = await orderApi.confirmOrder(order.id);
      message.success(`Đơn #ORD-${order.id} (Máy ${order.computerCode}) đã được xác nhận thành công!`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-topbar-pending-orders'] }),
      ]);
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      message.error(axiosErr.response?.data?.message || 'Không thể xác nhận đơn hàng lúc này!');
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const handleCancelOrder = (order: OrderResponse) => {
    modal.confirm({
      title: (
        <span className="text-sand font-bold text-base">
          Xác nhận hủy đơn hàng #ORD-{order.id}?
        </span>
      ),
      content: (
        <div className="text-xs text-mist space-y-2 mt-2">
          <p>
            Bạn có chắc chắn muốn hủy đơn hàng của khách hàng{' '}
            <strong className="text-sand">{order.customerName}</strong> tại{' '}
            <strong className="text-gold">{order.computerCode}</strong>?
          </p>
          <div className="p-2.5 rounded-lg bg-midnight/60 border border-[rgba(167,158,156,0.1)] text-[11px]">
            Tổng tiền đơn: <strong className="text-sand font-mono">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</strong>
          </div>
        </div>
      ),
      okText: 'Hủy đơn hàng',
      okType: 'danger',
      cancelText: 'Quay lại',
      styles: {
        body: {
          backgroundColor: '#10232A',
          padding: '24px',
          borderRadius: '16px',
        },
        mask: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
        },
      },
      onOk: async () => {
        try {
          setProcessingOrderId(order.id);
          setProcessingAction('cancel');
          await orderApi.cancelOrder(order.id);
          message.success(`Đơn #ORD-${order.id} đã được hủy thành công.`);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['staff-orders'] }),
            queryClient.invalidateQueries({ queryKey: ['staff-topbar-pending-orders'] }),
          ]);
          if (selectedOrder?.id === order.id) {
            setIsDetailOpen(false);
            setSelectedOrder(null);
          }
        } catch (err: unknown) {
          const axiosErr = err as AxiosError<{ message?: string }>;
          message.error(axiosErr.response?.data?.message || 'Không thể hủy đơn hàng lúc này!');
        } finally {
          setProcessingOrderId(null);
          setProcessingAction(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Header & Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-sand flex items-center gap-2.5">
              <ReceiptText className="w-6 h-6 text-gold" />
              Hàng đợi đơn hàng (Order Queue)
            </h1>

            {pendingCount > 0 && (
              <Badge
                count={pendingCount}
                className="site-badge-count-4"
                styles={{
                  indicator: {
                    backgroundColor: '#B58863',
                    color: '#10232A',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(181,136,99,0.6)',
                  },
                }}
              />
            )}
          </div>
          <p className="text-xs text-mist mt-1">
            Tiếp nhận, duyệt và xử lý đơn gọi món F&B từ khách hàng (Tự động cập nhật mỗi 5 giây).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<RefreshCw className={`w-4 h-4 text-gold ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[rgba(61,77,85,0.4)] hover:bg-[rgba(181,136,99,0.18)] border border-[rgba(167,158,156,0.15)] text-sand hover:text-gold cursor-pointer"
          >
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <GlassCard className="p-4 rounded-2xl border border-[rgba(167,158,156,0.15)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Segmented Tabs: Pending, Confirmed, Cancelled, All */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-mist flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-gold" />
            Lọc:
          </span>
          <Segmented
            value={statusTab}
            onChange={(val) => setStatusTab(val as OrderQueueTab)}
            options={[
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <Clock className="w-3.5 h-3.5 text-warning" />
                    Chờ xử lý ({pendingCount})
                  </span>
                ),
                value: 'PENDING_PAYMENT',
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    Đã xác nhận
                  </span>
                ),
                value: 'CONFIRMED',
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <XCircle className="w-3.5 h-3.5 text-danger" />
                    Đã hủy
                  </span>
                ),
                value: 'CANCELLED',
              },
              {
                label: 'Tất cả đơn',
                value: 'ALL',
              },
            ]}
            className="bg-midnight/70 p-1 rounded-xl text-xs font-medium text-sand"
          />
        </div>

        {/* Ô Tìm kiếm nhanh */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Tìm theo mã đơn #12, máy PC-01, SĐT..."
            prefix={<Search className="w-4 h-4 text-mist mr-1" />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            className="bg-midnight/80 border-[rgba(167,158,156,0.2)] text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-10"
          />
        </div>
      </GlassCard>

      {/* 3. Lưới Thẻ Đơn Hàng */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <GlassCard key={idx} className="p-5 rounded-2xl border border-[rgba(167,158,156,0.1)]">
              <Skeleton active paragraph={{ rows: 4 }} />
            </GlassCard>
          ))}
        </div>
      ) : isError ? (
        <GlassCard className="p-8 text-center border border-danger/30 rounded-2xl">
          <p className="text-danger font-medium mb-3">Không thể tải danh sách đơn hàng!</p>
          <Button onClick={() => refetch()} className="bg-gold text-midnight border-none font-bold rounded-xl">
            Thử lại
          </Button>
        </GlassCard>
      ) : orders.length === 0 ? (
        <GlassCard className="p-12 text-center border border-[rgba(167,158,156,0.15)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(181,136,99,0.12)] text-gold flex items-center justify-center mx-auto mb-4 border border-[rgba(181,136,99,0.2)]">
            <ReceiptText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-sand mb-1">
            {statusTab === 'PENDING_PAYMENT'
              ? 'Không có đơn hàng nào đang chờ xử lý'
              : 'Không tìm thấy đơn hàng nào trong danh mục này'}
          </h3>
          <p className="text-xs text-mist max-w-sm mx-auto">
            {statusTab === 'PENDING_PAYMENT'
              ? 'Khi khách hàng đặt món tại máy trạm hoặc quét QR, đơn mới sẽ tự động hiển thị tại đây sau 5 giây.'
              : 'Vui lòng chuyển tab hoặc kiểm tra từ khóa tìm kiếm.'}
          </p>
        </GlassCard>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.88,
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <StaffOrderCard
                  order={order}
                  onViewDetail={handleViewDetail}
                  onConfirmOrder={handleConfirmOrder}
                  onCancelOrder={handleCancelOrder}
                  isConfirming={processingOrderId === order.id && processingAction === 'confirm'}
                  isCancelling={processingOrderId === order.id && processingAction === 'cancel'}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 4. Drawer Chi Tiết Đơn Hàng (Slide-in) */}
      <StaffOrderDetailDrawer
        open={isDetailOpen}
        order={selectedOrder}
        onClose={() => setIsDetailOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        onCancelOrder={handleCancelOrder}
        isConfirming={selectedOrder ? processingOrderId === selectedOrder.id && processingAction === 'confirm' : false}
        isCancelling={selectedOrder ? processingOrderId === selectedOrder.id && processingAction === 'cancel' : false}
      />
    </div>
  );
};
