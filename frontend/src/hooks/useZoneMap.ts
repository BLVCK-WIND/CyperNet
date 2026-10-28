import { useQuery } from '@tanstack/react-query';
import { zoneApi } from '@/api/zoneApi';
import type { ZoneResponse } from '@/types/zone';

export function useZoneMap() {
  const { data: zones = [], isLoading, refetch } = useQuery({
    queryKey: ['active-zones'],
    queryFn: () => zoneApi.getActiveZones(),
    staleTime: 60 * 1000, // 1 minute cache
  });

  const zoneMap = new Map<string, ZoneResponse>();
  for (const z of zones) {
    if (z.code) {
      zoneMap.set(z.code.toUpperCase(), z);
    }
  }

  const getZoneColor = (zoneCode?: string | null, fallbackColor?: string | null): string => {
    if (!zoneCode) return fallbackColor || '#85C1DC';
    const upper = zoneCode.toUpperCase();
    const info = zoneMap.get(upper);
    if (info?.colorCode && info.colorCode.toUpperCase() !== '#434E60') {
      return info.colorCode;
    }
    if (fallbackColor && fallbackColor.toUpperCase() !== '#434E60') {
      return fallbackColor;
    }
    if (upper === 'VIP') return '#bd9875';
    if (upper === 'STANDARD' || upper === 'STD') return '#85C1DC';
    return '#85C1DC';
  };

  const getZoneShortLabel = (zoneCode?: string | null): string => {
    if (!zoneCode) return 'STD';
    const upper = zoneCode.toUpperCase();
    if (upper === 'STANDARD') return 'STD';
    return upper;
  };

  const getZoneFullName = (zoneCode?: string | null): string => {
    if (!zoneCode) return 'Tiêu Chuẩn';
    const upper = zoneCode.toUpperCase();
    const info = zoneMap.get(upper);
    return info?.name || (upper === 'STANDARD' ? 'Tiêu Chuẩn' : upper);
  };

  return {
    zones,
    zoneMap,
    isLoading,
    refetch,
    getZoneColor,
    getZoneShortLabel,
    getZoneFullName,
  };
}
