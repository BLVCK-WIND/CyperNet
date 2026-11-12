import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/reportApi';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';
import { useAuthStore } from '@/store/authStore';
import { useVietnamDate } from '@/hooks/useVietnamDate';

export const useAdminStats = () => {
  const user = useAuthStore((state) => state.user);
  const today = useVietnamDate();
  const enabled = user?.role === 'ADMIN';
  const scope = ['admin', 'dashboard-stats', user?.id, user?.role];
  const revenueQuery = useQuery({
    queryKey: [...scope, 'revenue', today],
    queryFn: () => reportApi.getRevenueSummary({ fromDate: today, toDate: today }),
    enabled, refetchInterval: 15000,
  });
  const computersQuery = useQuery({
    queryKey: [...scope, 'computers'],
    queryFn: async () => {
      const { content } = await computerApi.getAllComputers();
      const active = content.filter((c) => c.status === 'IN_USE').length;
      return { total: content.length, active,
        available: content.filter((c) => c.status === 'AVAILABLE').length,
        maintenance: content.filter((c) => c.status === 'MAINTENANCE').length,
        occupancyRate: content.length ? Math.round(active / content.length * 100) : 0 };
    },
    enabled, refetchInterval: 15000,
  });
  const sessionsQuery = useQuery({
    queryKey: [...scope, 'sessions'],
    queryFn: async () => (await sessionApi.getSessions({ status: 'ACTIVE', page: 0, size: 1 })).totalElements,
    enabled, refetchInterval: 15000,
  });
  return { today, revenueQuery, computersQuery, sessionsQuery,
    isFetching: revenueQuery.isFetching || computersQuery.isFetching || sessionsQuery.isFetching,
    refetch: () => Promise.all([revenueQuery.refetch(), computersQuery.refetch(), sessionsQuery.refetch()]) };
};
