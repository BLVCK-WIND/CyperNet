import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { reportApi } from '@/api/reportApi';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';

export interface AdminStatsData {
  todayRevenue: number;
  cashRevenue: number;
  qrRevenue: number;
  todayOrdersCount: number;
  todayTimePurchasesCount: number;
  totalComputers: number;
  activeComputers: number;
  availableComputers: number;
  maintenanceComputers: number;
  occupancyRate: number;
  activeSessionsCount: number;
}

export const useAdminStats = () => {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dashboard-stats', todayStr],
    queryFn: async (): Promise<AdminStatsData> => {
      // Gọi song song 3 API: Doanh thu hôm nay, Danh sách máy trạm, Phiên đang chạy
      const [summaryRes, computersRes, sessionsRes] = await Promise.all([
        reportApi.getRevenueSummary({ fromDate: todayStr, toDate: todayStr }).catch(() => null),
        computerApi.getComputers({ size: 100 }).catch(() => null),
        sessionApi.getSessions({ status: 'ACTIVE', size: 100 }).catch(() => null),
      ]);

      const computers = computersRes?.content || [];
      const totalComputers = computersRes?.totalElements || computers.length;
      const activeComputers = computers.filter((c) => c.status === 'IN_USE').length;
      const availableComputers = computers.filter((c) => c.status === 'AVAILABLE').length;
      const maintenanceComputers = computers.filter((c) => c.status === 'MAINTENANCE').length;
      const occupancyRate = totalComputers > 0 ? Math.round((activeComputers / totalComputers) * 100) : 0;

      const activeSessionsCount = sessionsRes?.totalElements || sessionsRes?.content?.length || 0;

      return {
        todayRevenue: summaryRes?.totalRevenue || 0,
        cashRevenue: summaryRes?.cashRevenue || 0,
        qrRevenue: summaryRes?.qrRevenue || 0,
        todayOrdersCount: summaryRes?.totalOrders || 0,
        todayTimePurchasesCount: summaryRes?.totalTimePurchases || 0,
        totalComputers,
        activeComputers,
        availableComputers,
        maintenanceComputers,
        occupancyRate,
        activeSessionsCount,
      };
    },
    staleTime: 30_000,
    refetchInterval: 15_000,
  });

  return {
    stats: data,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
