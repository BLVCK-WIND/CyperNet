import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/orderApi';
import { useAuthStore } from '@/store/authStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useVietnamDate } from '@/hooks/useVietnamDate';
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
  const user = useAuthStore((state) => state.user);
  const today = useVietnamDate();
  const keyword = useDebouncedValue(searchKeyword.trim());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageScope = JSON.stringify([user?.id, user?.role, statusTab, paymentMethodFilter, keyword, page, pageSize]);
  // 1. Query danh sách đơn hàng theo Tab đang chọn
  const {
    data: ordersData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['staff-order-queue', user?.id, user?.role, statusTab, paymentMethodFilter, keyword, page, pageSize],
    queryFn: ({ signal }) =>
      orderApi.searchOrders({
        status: statusTab === 'ALL' ? undefined : statusTab,
        paymentMethod: paymentMethodFilter === 'ALL' ? undefined : paymentMethodFilter,
        keyword,
        page: page - 1,
        size: pageSize,
        // Hàng đợi Chờ xử lý: FIFO (createdAt,asc) để người chờ lâu nhất được ưu tiên làm trước.
        // Các tab hoàn thành/hủy/tất cả: LIFO (createdAt,desc) để xem đơn mới cập nhật gần nhất.
        sort: statusTab === 'PENDING_PAYMENT' ? 'createdAt,asc' : 'createdAt,desc',
      }, signal),
    enabled: Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN')),
    // 5s polling cho đơn chờ xử lý, 15s cho các tab đã hoàn thành
    refetchInterval: statusTab === 'PENDING_PAYMENT' || statusTab === 'ALL' ? 5000 : 15000,
  });

  useEffect(() => {
    if (ordersData && page > Math.max(1, ordersData.totalPages)) setPage(Math.max(1, ordersData.totalPages));
  }, [ordersData, page]);

  const summaryQuery = useQuery({
    queryKey: ['staff-order-summary', user?.id, user?.role, today],
    queryFn: ({ signal }) => orderApi.getSummary(signal),
    enabled: Boolean(user && (user.role === 'STAFF' || user.role === 'ADMIN')),
    refetchInterval: 5000,
  });
  // Failed/current-day-mismatched data is unavailable, never a synthetic zero.
  const summary = !summaryQuery.isError && summaryQuery.data?.date === today ? summaryQuery.data : undefined;
  const rawOrders: OrderResponse[] = ordersData?.content || [];
  const pendingCount = summary?.pendingCount;
  const confirmedCount = summary?.countsByStatus.CONFIRMED;
  const cancelledCount = summary?.countsByStatus.CANCELLED;
  const allCount = summary ? Object.values(summary.countsByStatus).reduce((sum, count) => sum + count, 0) : undefined;

  return {
    orders: rawOrders,
    page,
    pageSize,
    totalElements: ordersData?.totalElements ?? 0,
    pageScope,
    resetPage: () => setPage(1),
    changePage: (next: number, size: number) => { setPage(size === pageSize ? next : 1); setPageSize(size); },
    rawOrders,
    pendingCount,
    confirmedCount,
    cancelledCount,
    allCount,
    summary,
    summaryQuery,
    confirmedRevenue: summary?.todayFoodAndDrinkRevenue,
    pendingAmount: summary?.pendingAmount,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
