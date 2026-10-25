import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import type { OrderResponse, OrderStatus } from '@/types/order';

export type OrderQueueTab = OrderStatus | 'ALL';

interface UseOrderQueueOptions {
  statusTab: OrderQueueTab;
  searchKeyword?: string;
}

export const useOrderQueue = ({
  statusTab,
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
    // 5s polling cho đơn chờ xử lý, 15s cho các tab đã hoàn thành
    refetchInterval: statusTab === 'PENDING_PAYMENT' || statusTab === 'ALL' ? 5000 : 15000,
  });

  // 2. Query riêng đếm số lượng đơn PENDING_PAYMENT để hiển thị Badge cố định
  const { data: pendingSummaryData } = useQuery({
    queryKey: ['staff-pending-orders-count'],
    queryFn: () => orderApi.getOrders({ status: 'PENDING_PAYMENT', page: 0, size: 1 }),
    refetchInterval: 5000,
  });

  const rawOrders: OrderResponse[] = ordersData?.content || [];
  const pendingCount = pendingSummaryData?.totalElements ?? 0;

  // 3. Lọc đơn theo từ khóa tìm kiếm client-side (mã đơn #123, mã máy PC-01, tên khách, SĐT)
  const filteredOrders = useMemo(() => {
    if (!searchKeyword.trim()) {
      return rawOrders;
    }

    const term = searchKeyword.trim().toLowerCase();
    return rawOrders.filter((order) => {
      const matchId = String(order.id).includes(term) || `ord-${order.id}`.toLowerCase().includes(term);
      const matchComputer = order.computerCode?.toLowerCase().includes(term) || false;
      const matchCustomerName = order.customerName?.toLowerCase().includes(term) || false;
      const matchCustomerPhone = order.customerPhone?.toLowerCase().includes(term) || false;

      return matchId || matchComputer || matchCustomerName || matchCustomerPhone;
    });
  }, [rawOrders, searchKeyword]);

  return {
    orders: filteredOrders,
    rawOrders,
    pendingCount,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
