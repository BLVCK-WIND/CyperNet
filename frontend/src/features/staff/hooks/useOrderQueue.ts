import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse, OrderStatus } from '@/types/order';

export type OrderQueueTab = OrderStatus | 'ALL';
export type PaymentMethodFilter = 'ALL' | 'CASH' | 'QR';

interface UseOrderQueueOptions {
  statusTab: OrderQueueTab;
  paymentMethodFilter?: PaymentMethodFilter;
  searchKeyword?: string;
}

export const useOrderQueue = ({
  statusTab,
  paymentMethodFilter = 'ALL',
  searchKeyword = '',
}: UseOrderQueueOptions) => {
  // 1. Query danh sách đơn hàng theo Tab đang chọn
  const {
    data: ordersData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['staff-order-queue', statusTab],
    queryFn: () =>
      orderApi.getOrders({
        status: statusTab === 'ALL' ? undefined : statusTab,
        page: 0,
        size: 50,
        sort: 'createdAt,desc',
      }),
    placeholderData: keepPreviousData,
    // 5s polling cho đơn chờ xử lý, 15s cho các tab đã hoàn thành
    refetchInterval: statusTab === 'PENDING_PAYMENT' || statusTab === 'ALL' ? 5000 : 15000,
  });

  // 2. Query thống kê tổng hợp số lượng & doanh thu đơn
  const { data: pendingSummaryData } = useQuery({
    queryKey: ['staff-pending-orders-summary'],
    queryFn: () => orderApi.getOrders({ status: 'PENDING_PAYMENT', page: 0, size: 100 }),
    refetchInterval: 5000,
  });

  const { data: confirmedSummaryData } = useQuery({
    queryKey: ['staff-confirmed-orders-summary'],
    queryFn: () => orderApi.getOrders({ status: 'CONFIRMED', page: 0, size: 100 }),
    refetchInterval: 10000,
  });

  const { data: cancelledSummaryData } = useQuery({
    queryKey: ['staff-cancelled-orders-summary'],
    queryFn: () => orderApi.getOrders({ status: 'CANCELLED', page: 0, size: 100 }),
    refetchInterval: 15000,
  });

  const { data: allSummaryData } = useQuery({
    queryKey: ['staff-all-orders-summary'],
    queryFn: () => orderApi.getOrders({ page: 0, size: 100 }),
    refetchInterval: 10000,
  });

  const rawOrders: OrderResponse[] = ordersData?.content || [];
  const pendingCount = pendingSummaryData?.totalElements ?? 0;
  const confirmedCount = confirmedSummaryData?.totalElements ?? 0;
  const cancelledCount = cancelledSummaryData?.totalElements ?? 0;
  const allCount = allSummaryData?.totalElements ?? 0;

  // Tính tổng tiền đơn đã xác nhận và đơn đang chờ
  const confirmedRevenue = useMemo(() => {
    return (confirmedSummaryData?.content || []).reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
  }, [confirmedSummaryData]);

  const pendingAmount = useMemo(() => {
    return (pendingSummaryData?.content || []).reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
  }, [pendingSummaryData]);

  // 3. Lọc đơn theo phương thức thanh toán và từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    let result = rawOrders;

    if (paymentMethodFilter !== 'ALL') {
      result = result.filter((o) => o.paymentMethod === paymentMethodFilter);
    }

    if (!searchKeyword.trim()) {
      return result;
    }

    const term = searchKeyword.trim().toLowerCase();
    return result.filter((order) => {
      const matchId = String(order.id).includes(term) || `ord-${order.id}`.toLowerCase().includes(term);
      const matchComputer = order.computerCode?.toLowerCase().includes(term) || false;
      const matchCustomerName = order.customerName?.toLowerCase().includes(term) || false;
      const matchCustomerPhone = order.customerPhone?.toLowerCase().includes(term) || false;

      return matchId || matchComputer || matchCustomerName || matchCustomerPhone;
    });
  }, [rawOrders, paymentMethodFilter, searchKeyword]);

  // Phân tích thống kê luồng đơn chờ (Pending breakdown)
  const pendingBreakdown = useMemo(() => {
    const list = pendingSummaryData?.content || [];
    const cashCount = list.filter((o) => o.paymentMethod === 'CASH').length;
    const qrCount = list.filter((o) => o.paymentMethod === 'QR').length;
    const foodOnlyCount = list.filter((o) => o.items.every((it) => it.itemType !== 'PLAYTIME')).length;
    const playtimeCount = list.filter((o) => o.items.some((it) => it.itemType === 'PLAYTIME')).length;

    return {
      cashCount,
      qrCount,
      foodOnlyCount,
      playtimeCount,
    };
  }, [pendingSummaryData]);

  return {
    orders: filteredOrders,
    rawOrders,
    pendingCount,
    confirmedCount,
    cancelledCount,
    allCount,
    confirmedRevenue,
    pendingAmount,
    pendingBreakdown,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
