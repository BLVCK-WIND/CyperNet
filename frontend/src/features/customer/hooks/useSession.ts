import { useQuery } from '@tanstack/react-query';
import { sessionApi } from '@/api/sessionApi';
import { useAuthStore } from '@/store/authStore';
import type { SessionResponse } from '@/types/auth';

interface UseSessionOptions {
  computerCode?: string;
  enabled?: boolean;
}

export function useSession({ computerCode, enabled = true }: UseSessionOptions = {}) {
  const { setSessionId, updateUser, user, isAuthenticated } = useAuthStore();

  const query = useQuery<SessionResponse>({
    queryKey: ['active-session', computerCode],
    queryFn: async () => {
      if (!computerCode) {
        throw new Error('Mã máy trạm không được để trống');
      }
      const data = await sessionApi.getActiveSession(computerCode);
      if (data?.id) {
        setSessionId(data.id);
      }
      if (user && data.accountRemainingMinutes !== undefined) {
        updateUser({
          ...user,
          remainingMinutes: data.accountRemainingMinutes,
        });
      }
      return data;
    },
    enabled: Boolean(computerCode && enabled && isAuthenticated),
    refetchInterval: 15000, // Định kỳ 15 giây đồng bộ trạng thái phiên
    retry: 1,
  });

  return query;
}
