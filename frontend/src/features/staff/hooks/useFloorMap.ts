import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { computerApi } from '@/api/computerApi';
import { sessionApi } from '@/api/sessionApi';
import type { FloorMapComputerItem } from '@/types/computer';

interface UseFloorMapOptions {
  statusFilter?: string;
  zoneFilter?: string;
  searchKeyword?: string;
}

export const useFloorMap = ({
  statusFilter = 'ALL',
  zoneFilter = 'ALL',
  searchKeyword = '',
}: UseFloorMapOptions = {}) => {
  // Gọi song song danh sách máy trạm và các phiên chơi đang ACTIVE
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['staff-floormap-data'],
    queryFn: async () => {
      const [computersRes, sessionsRes] = await Promise.all([
        computerApi.getComputers({ size: 100, sort: 'id,asc' }),
        sessionApi.getSessions({ status: 'ACTIVE', size: 100 }),
      ]);

      const computers = computersRes.content || [];
      const activeSessions = sessionsRes.content || [];

      // Ghép session đang ACTIVE vào từng máy theo computerCode
      const joinedItems: FloorMapComputerItem[] = computers.map((computer) => {
        const session = activeSessions.find(
          (s) => s.computerCode === computer.code || s.computerId === computer.id
        );

        return {
          ...computer,
          activeSession: session || null,
        };
      });

      return {
        computers: joinedItems,
        rawComputers: computers,
        activeSessions,
      };
    },
    refetchInterval: 10000, // 10s polling theo thỏa thuận MVP
  });

  const allComputers = useMemo(() => data?.computers || [], [data?.computers]);

  // Thống kê tổng hợp số lượng máy
  const stats = useMemo(() => {
    let availableCount = 0;
    let inUseCount = 0;
    let maintenanceCount = 0;
    let vipCount = 0;
    let standardCount = 0;

    for (const c of allComputers) {
      if (c.status === 'AVAILABLE') availableCount++;
      else if (c.status === 'IN_USE') inUseCount++;
      else if (c.status === 'MAINTENANCE') maintenanceCount++;

      if (c.zone === 'VIP') vipCount++;
      else if (c.zone === 'STANDARD') standardCount++;
    }

    return {
      total: allComputers.length,
      availableCount,
      inUseCount,
      maintenanceCount,
      vipCount,
      standardCount,
    };
  }, [allComputers]);

  // Lọc máy theo status, zone và từ khóa tìm kiếm (Client-side mượt mà)
  const filteredComputers = useMemo(() => {
    return allComputers.filter((item) => {
      // 1. Lọc theo trạng thái máy
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 2. Lọc theo khu vực (Zone)
      if (zoneFilter !== 'ALL' && item.zone !== zoneFilter) {
        return false;
      }

      // 3. Lọc theo từ khóa tìm kiếm (mã máy, tên khách, SĐT)
      if (searchKeyword.trim()) {
        const term = searchKeyword.trim().toLowerCase();
        const matchCode = item.code.toLowerCase().includes(term);
        const matchCustomerName =
          item.activeSession?.accountName?.toLowerCase().includes(term) || false;
        const matchCustomerPhone =
          item.activeSession?.accountPhone?.toLowerCase().includes(term) || false;

        return matchCode || matchCustomerName || matchCustomerPhone;
      }

      return true;
    });
  }, [allComputers, statusFilter, zoneFilter, searchKeyword]);

  return {
    computers: filteredComputers,
    allComputers,
    stats,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
};
