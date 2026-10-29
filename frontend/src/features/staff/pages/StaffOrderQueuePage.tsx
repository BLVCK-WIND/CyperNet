import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input, Button, Skeleton, Segmented, Select, Badge, App } from 'antd';
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
  ShoppingBag,
  Coins,
  Utensils,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StaffOrderCard } from '../components/StaffOrderCard';
import { StaffOrderDetailDrawer } from '../components/StaffOrderDetailDrawer';
import { ConfirmOrderModal } from '../components/ConfirmOrderModal';
import { useOrderQueue, type OrderQueueTab, type PaymentMethodFilter } from '../hooks/useOrderQueue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse } from '@/types/order';

export const StaffOrderQueuePage: React.FC = () => {
  const { message, notification } = App.useApp();
  const queryClient = useQueryClient();
  useDocumentTitle('Hàng đợi đơn hàng (Order Queue) • CyberNet');

  const [statusTab, setStatusTab] = useState<OrderQueueTab>('PENDING_PAYMENT');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethodFilter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [processingAction, setProcessingAction] = useState<'confirm' | 'cancel' | null>(null);
  const [actionModalOrder, setActionModalOrder] = useState<OrderResponse | null>(null);
  const [actionModalType, setActionModalType] = useState<'confirm' | 'cancel'>('confirm');

  // Quản lý hiệu ứng Flash 3s cho đơn mới xuất hiện
  const [flashOrderIds, setFlashOrderIds] = useState<Set<number>>(new Set());
  const knownOrderIdsRef = useRef<Set<number>>(new Set());

  const {
    orders,
    pendingCount,
    confirmedCount,
    cancelledCount,
    allCount,
    confirmedRevenue,
    pendingAmount,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useOrderQueue({
    statusTab,
    paymentMethodFilter: paymentFilter,
    searchKeyword,
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Hiệu ứng thông báo nhanh 2-3s khi có đơn hàng mới xuất hiện
  useEffect(() => {
    if (orders.length === 0) return;

    // Lần đầu vào trang: chỉ ghi nhận ID các đơn hiện tại, không spam thông báo
    if (knownOrderIdsRef.current.size === 0) {
      orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      return;
    }

    // Các lần kế tiếp: phát hiện đơn mới xuất hiện trong hàng đợi
    const newlyArrived = orders.filter(
      (o) =>
        !knownOrderIdsRef.current.has(o.id) &&
        (o.status === 'PENDING_PAYMENT' || o.status === 'WAITING_CONFIRMATION')
    );

    if (newlyArrived.length > 0) {
      newlyArrived.forEach((newOrder) => {
        knownOrderIdsRef.current.add(newOrder.id);

        // Bật hiệu ứng Flash viền vàng phát sáng trên thẻ
        setFlashOrderIds((prev) => new Set(prev).add(newOrder.id));

        // Toast thông báo góc phải trong đúng 3s rồi tự biến mất
        notification.open({
          key: `new-order-${newOrder.id}`,
          message: (
            <div className="flex items-center gap-2 text-sand font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              <span>Đơn hàng mới #ORD-{newOrder.id}</span>
            </div>
          ),
          description: (
            <div className="text-xs text-sand/85 space-y-0.5">
              <div>
                Máy <strong className="text-gold font-mono">{newOrder.computerCode}</strong>
                {newOrder.computerZone ? ` • Khu ${newOrder.computerZone}` : ''}
              </div>
              <div className="font-semibold text-gold font-mono">
                {formatCurrency(newOrder.totalAmount)} (
                {newOrder.paymentMethod === 'QR' ? 'VietQR' : 'Tiền mặt'})
              </div>
            </div>
          ),
          duration: 3, // Đúng 3 giây tự biến mất
          placement: 'topRight',
          style: {
            backgroundColor: '#1b1e2b',
            border: '1px solid rgba(189, 152, 117, 0.45)',
            borderRadius: '16px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(189, 152, 117, 0.25)',
          },
        });

        // Sau đúng 3s: gỡ hiệu ứng flash, đơn nằm bình tĩnh vào hàng đợi
        setTimeout(() => {
          setFlashOrderIds((prev) => {
            const next = new Set(prev);
            next.delete(newOrder.id);
            return next;
          });
        }, 3000);
      });
    }

    // Cập nhật danh sách ID đã biết
    orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
  }, [orders, notification]);

  // Phân chia 2 luồng đơn hàng đồng bộ trên mọi Tab:
  // 1. Cột Bếp: Đơn thuần món ăn & đồ uống (F&B only)
  const foodOnlyOrders = useMemo(() => {
    return orders.filter((o) => o.items.every((it) => it.itemType !== 'PLAYTIME'));
  }, [orders]);

  // 2. Cột Thu ngân: Đơn có kèm nạp giờ chơi (Playtime only hoặc Combo Món + Giờ)
  const playtimeOrders = useMemo(() => {
    return orders.filter((o) => o.items.some((it) => it.itemType === 'PLAYTIME'));
  }, [orders]);

  // Cấu hình mô tả & thông báo rỗng theo Tab đang chọn
  const columnDescriptions = useMemo(() => {
    switch (statusTab) {
      case 'PENDING_PAYMENT':
        return {
          kitchenSubtitle: 'Đơn thuần món ăn, nước giải khát — Bếp chế biến & giao bàn',
          kitchenEmpty: 'Hiện không có đơn đồ ăn/nước uống nào đang chờ làm.',
          cashierSubtitle: 'Đơn kèm nạp giờ — Thu tiền & kiểm tra trước khi duyệt',
          cashierEmpty: 'Hiện không có đơn nạp giờ chơi nào đang chờ xử lý.',
        };
      case 'CONFIRMED':
        return {
          kitchenSubtitle: 'Đơn thuần món ăn, nước giải khát — Đã chế biến & hoàn tất giao bàn',
          kitchenEmpty: 'Chưa có đơn đồ ăn/nước uống nào đã hoàn thành trong bộ lọc này.',
          cashierSubtitle: 'Đơn kèm nạp giờ — Đã thu tiền & nạp thành công vào máy trạm',
          cashierEmpty: 'Chưa có đơn nạp giờ chơi nào đã xác nhận trong bộ lọc này.',
        };
      case 'CANCELLED':
        return {
          kitchenSubtitle: 'Lịch sử đơn món ăn, nước giải khát đã bị hủy',
          kitchenEmpty: 'Không có đơn đồ ăn/nước uống nào bị hủy trong bộ lọc này.',
          cashierSubtitle: 'Lịch sử đơn nạp giờ chơi & combo đã bị hủy',
          cashierEmpty: 'Không có đơn nạp giờ chơi nào bị hủy trong bộ lọc này.',
        };
      case 'ALL':
      default:
        return {
          kitchenSubtitle: 'Toàn bộ đơn thuần món ăn & nước uống trong hệ thống',
          kitchenEmpty: 'Không tìm thấy đơn đồ ăn/nước uống nào phù hợp.',
          cashierSubtitle: 'Toàn bộ đơn có nạp giờ chơi & combo trong hệ thống',
          cashierEmpty: 'Không tìm thấy đơn nạp giờ chơi nào phù hợp.',
        };
    }
  }, [statusTab]);

  const handleViewDetail = (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const executeConfirmOrder = async (orderId: number, computerCode?: string) => {
    try {
      setProcessingOrderId(orderId);
      setProcessingAction('confirm');
      const updatedOrder = await orderApi.confirmOrder(orderId);
      message.success(`Đơn #ORD-${orderId} ${computerCode ? `(Máy ${computerCode})` : ''} đã được xác nhận thành công!`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-order-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-topbar-pending-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-pending-orders-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-confirmed-orders-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-all-orders-summary'] }),
      ]);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setActionModalOrder(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      message.error(axiosErr.response?.data?.message || 'Không thể xác nhận đơn hàng lúc này!');
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const executeCancelOrder = async (orderId: number) => {
    try {
      setProcessingOrderId(orderId);
      setProcessingAction('cancel');
      await orderApi.cancelOrder(orderId);
      message.success(`Đơn #ORD-${orderId} đã được hủy thành công.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['staff-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-order-queue'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-topbar-pending-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-pending-orders-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-confirmed-orders-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-all-orders-summary'] }),
      ]);
      if (selectedOrder?.id === orderId) {
        setIsDetailOpen(false);
        setSelectedOrder(null);
      }
      setActionModalOrder(null);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      message.error(axiosErr.response?.data?.message || 'Không thể hủy đơn hàng lúc này!');
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const handleConfirmOrder = (order: OrderResponse) => {
    setActionModalOrder(order);
    setActionModalType('confirm');
  };

  const handleCancelOrder = (order: OrderResponse) => {
    setActionModalOrder(order);
    setActionModalType('cancel');
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
                    backgroundColor: '#bd9875',
                    color: '#202332',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(189,152,117,0.6)',
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
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl twinkle-btn-secondary cursor-pointer"
          >
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Dải Thống Kê Nhanh Đơn Hàng (Order Telemetry Strip - Liquid Glass 3D) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Thẻ 1: Đơn chờ xác nhận (Cam cháy hoàng hôn) */}
        <div className="liquid-glass-sunset flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <ReceiptText className="w-3.5 h-3.5 text-[#fb923c]" />
                Chờ xác nhận
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  pendingCount > 0
                    ? 'bg-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.9)] animate-pulse'
                    : 'bg-mist/40'
                }`}
              />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#fed7aa] drop-shadow-[0_2px_8px_rgba(234,88,12,0.5)] tracking-tight">
              {pendingCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">đơn món</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-sand/80">
            <span>Tạm tính:</span>
            <strong className="text-[#fb923c] font-bold">{formatCurrency(pendingAmount)}</strong>
          </div>
        </div>

        {/* Thẻ 2: Đã hoàn tất (Xanh lục ngọc bích) */}
        <div className="liquid-glass-emerald flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                Đã hoàn thành
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#4ADE80] drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] tracking-tight">
              {confirmedCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">đơn giao</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Trạng thái:</span>
            <span className="text-[#34d399] font-bold">Đã thu & giao món</span>
          </div>
        </div>

        {/* Thẻ 3: Tổng lượt gọi món (Xanh Cyan điện tử) */}
        <div className="liquid-glass-cyan flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#38bdf8]" />
                Tổng lượt gọi
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-[#38bdf8] drop-shadow-[0_2px_8px_rgba(6,182,212,0.5)] tracking-tight">
              {allCount}{' '}
              <span className="text-xs font-normal text-mist font-sans">lượt hôm nay</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Toàn hệ thống:</span>
            <span className="text-sand font-bold">{allCount} đơn hàng</span>
          </div>
        </div>

        {/* Thẻ 4: Doanh thu F&B (Hổ phách đậm & Kem sữa) */}
        <div className="liquid-glass-amber flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-sand/90 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#e0a96d]" />
                Doanh thu F&B
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e0a96d] shadow-[0_0_10px_rgba(224,169,109,0.9)]" />
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-gold drop-shadow-[0_2px_8px_rgba(189,152,117,0.4)] tracking-tight">
              {formatCurrency(confirmedRevenue)}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono backdrop-blur-md bg-black/20 rounded-xl px-2.5 py-1 text-mist">
            <span>Nguồn thu:</span>
            <span className="text-sand/90 font-bold">Bếp & Quầy Bar</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search (Twinkle Major Flow) */}
      <div className="p-4 rounded-2xl twinkle-major-flow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Segmented Tabs: Pending, Confirmed, Cancelled, All */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-sand flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-gold" />
            Trạng thái:
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
                    Đã xác nhận ({confirmedCount})
                  </span>
                ),
                value: 'CONFIRMED',
              },
              {
                label: (
                  <span className="flex items-center gap-1.5 px-1">
                    <XCircle className="w-3.5 h-3.5 text-danger" />
                    Đã hủy ({cancelledCount})
                  </span>
                ),
                value: 'CANCELLED',
              },
              {
                label: `Tất cả (${allCount})`,
                value: 'ALL',
              },
            ]}
            className="bg-midnight/70 p-1 rounded-xl text-xs font-medium text-sand"
          />
        </div>

        {/* Bộ lọc Phương thức thanh toán & Ô Tìm kiếm nhanh */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={paymentFilter}
            onChange={(val) => setPaymentFilter(val)}
            className="h-10 w-44"
            options={[
              { value: 'ALL', label: 'Tất cả phương thức' },
              { value: 'CASH', label: '💵 Chỉ Tiền mặt' },
              { value: 'QR', label: '📱 Chỉ VietQR Banking' },
            ]}
          />

          <div className="w-full sm:w-72">
            <Input
              placeholder="Tìm theo mã đơn #12, máy PC-01, SĐT..."
              prefix={<Search className="w-4 h-4 text-mist mr-1" />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              className="bg-midnight/80 border-mist/20 text-sand placeholder:text-mist/50 focus:border-gold hover:border-gold-light rounded-xl h-10 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 4. Lưới Thẻ Đơn Hàng / Phân Luồng 2 Cột Đồng Bộ Trên Mọi Tab */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-3.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <GlassCard key={idx} className="p-5 rounded-2xl border border-mist/15">
                <Skeleton active paragraph={{ rows: 3 }} />
              </GlassCard>
            ))}
          </div>
          <div className="space-y-3.5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <GlassCard key={idx} className="p-5 rounded-2xl border border-mist/15">
                <Skeleton active paragraph={{ rows: 3 }} />
              </GlassCard>
            ))}
          </div>
        </div>
      ) : isError ? (
        <GlassCard className="p-8 text-center border border-danger/30 rounded-2xl">
          <p className="text-danger font-medium mb-3">Không thể tải danh sách đơn hàng!</p>
          <Button onClick={() => refetch()} className="bg-gold text-midnight border-none font-bold rounded-xl">
            Thử lại
          </Button>
        </GlassCard>
      ) : (
        /* PHÂN LUỒNG 2 CỘT DUAL-LANE ĐỒNG BỘ TRÊN MỌI TAB */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* CỘT 1: BẾP & PHA CHẾ (CHỈ MÓN ĂN & NƯỚC UỐNG) - MÁNG KANBAN F&B */}
          <div className="rounded-3xl p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-b from-amber-950/25 via-[#1c1f2e]/70 to-[#141622]/95 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col space-y-4">
            {/* Header Máng Bếp gắn liền */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-900/50 via-amber-800/30 to-[#202332]/90 border border-amber-500/40 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <Utensils className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-black text-sand flex items-center gap-2">
                    <span>BẾP & QUẦY PHA CHẾ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      F&B ONLY
                    </span>
                  </h3>
                  <p className="text-[11px] text-mist/90">
                    {columnDescriptions.kitchenSubtitle}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-midnight/80 border border-amber-500/30 text-xs font-mono font-bold text-sand shrink-0 shadow-inner">
                <span className="text-amber-400 text-sm font-black">{foodOnlyOrders.length}</span> đơn
              </div>
            </div>

            {/* Rãnh trượt đơn hàng (Lane Track) */}
            <div className="space-y-3.5 min-h-[280px]">
              {foodOnlyOrders.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-amber-500/20 bg-midnight/30 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400/50 border border-amber-500/20 flex items-center justify-center mb-2.5">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-mist font-medium">{columnDescriptions.kitchenEmpty}</p>
                </div>
              ) : (
                foodOnlyOrders.map((order) => (
                  <StaffOrderCard
                    key={order.id}
                    order={order}
                    onViewDetail={handleViewDetail}
                    onConfirmOrder={handleConfirmOrder}
                    onCancelOrder={handleCancelOrder}
                    isConfirming={processingOrderId === order.id && processingAction === 'confirm'}
                    isCancelling={processingOrderId === order.id && processingAction === 'cancel'}
                    isFlashNew={flashOrderIds.has(order.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* CỘT 2: THU NGÂN & NẠP GIỜ - MÁNG KANBAN PLAYTIME */}
          <div className="rounded-3xl p-4 sm:p-5 border border-cyan-500/30 bg-gradient-to-b from-cyan-950/25 via-[#1c1f2e]/70 to-[#141622]/95 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col space-y-4">
            {/* Header Máng Thu Ngân gắn liền */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-900/50 via-cyan-800/30 to-[#202332]/90 border border-cyan-500/40 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                  <Zap className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-black text-sand flex items-center gap-2">
                    <span>QUẦY THU NGÂN & NẠP GIỜ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                      PLAYTIME & COMBO
                    </span>
                  </h3>
                  <p className="text-[11px] text-mist/90">
                    {columnDescriptions.cashierSubtitle}
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-midnight/80 border border-cyan-500/30 text-xs font-mono font-bold text-sand shrink-0 shadow-inner">
                <span className="text-cyan-400 text-sm font-black">{playtimeOrders.length}</span> đơn
              </div>
            </div>

            {/* Rãnh trượt đơn hàng (Lane Track) */}
            <div className="space-y-3.5 min-h-[280px]">
              {playtimeOrders.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-cyan-500/20 bg-midnight/30 text-center flex flex-col items-center justify-center min-h-[220px]">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400/50 border border-cyan-500/20 flex items-center justify-center mb-2.5">
                    <Zap className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-mist font-medium">{columnDescriptions.cashierEmpty}</p>
                </div>
              ) : (
                playtimeOrders.map((order) => (
                  <StaffOrderCard
                    key={order.id}
                    order={order}
                    onViewDetail={handleViewDetail}
                    onConfirmOrder={handleConfirmOrder}
                    onCancelOrder={handleCancelOrder}
                    isConfirming={processingOrderId === order.id && processingAction === 'confirm'}
                    isCancelling={processingOrderId === order.id && processingAction === 'cancel'}
                    isFlashNew={flashOrderIds.has(order.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Drawer Chi Tiết Đơn Hàng (Slide-in) */}
      <StaffOrderDetailDrawer
        open={isDetailOpen}
        order={selectedOrder}
        onClose={() => setIsDetailOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        onCancelOrder={handleCancelOrder}
        isConfirming={selectedOrder ? processingOrderId === selectedOrder.id && processingAction === 'confirm' : false}
        isCancelling={selectedOrder ? processingOrderId === selectedOrder.id && processingAction === 'cancel' : false}
      />

      {/* 6. Popup Xác Nhận & Đối Soát Đơn Hàng (Custom CyberLux Modal) */}
      <ConfirmOrderModal
        isOpen={Boolean(actionModalOrder)}
        order={actionModalOrder}
        actionType={actionModalType}
        isProcessing={processingOrderId === actionModalOrder?.id}
        onClose={() => setActionModalOrder(null)}
        onConfirm={executeConfirmOrder}
        onCancelOrder={executeCancelOrder}
      />
    </div>
  );
};
