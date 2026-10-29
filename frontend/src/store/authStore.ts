import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { authApi } from '@/api/authApi';
import type { Account, AuthResponse, CustomerAuthResponse, Role } from '@/types/auth';

interface AuthState {
  user: Account | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: number | null;
  computerCode: string | null;
  role: Role | null;
  isAuthenticated: boolean;

  setCustomerAuth: (authData: CustomerAuthResponse, fallbackComputerCode?: string) => void;
  setStaffAuth: (authData: AuthResponse) => void;
  setSessionId: (sessionId: number | null) => void;
  setComputerCode: (code: string | null) => void;
  updateUser: (user: Account) => void;
  logout: () => Promise<void>;
}

// Khởi tạo state từ storage (khi reload F5)
const initialUser = storage.getUser();
const initialAccessToken = storage.getAccessToken();
const initialRefreshToken = storage.getRefreshToken();
const initialSessionId = storage.getSessionId();
const initialComputerCode = storage.getComputerCode();

export const useAuthStore = create<AuthState>((set, get) => {
  // Lắng nghe sự kiện token hết hạn từ axios interceptor
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:expired', () => {
      storage.clearAuth();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        sessionId: null,
        computerCode: null,
        role: null,
        isAuthenticated: false,
      });
    });
  }

  return {
    user: initialUser,
    accessToken: initialAccessToken,
    refreshToken: initialRefreshToken,
    sessionId: initialSessionId,
    computerCode: initialComputerCode,
    role: initialUser ? initialUser.role : null,
    isAuthenticated: Boolean(initialAccessToken && initialUser),

    setCustomerAuth: (data: CustomerAuthResponse, fallbackComputerCode?: string) => {
      storage.setAccessToken(data.accessToken);
      storage.setRefreshToken(data.refreshToken);
      storage.setUser(data.account);

      const sId = data.session?.id ?? null;
      const cCode = data.session?.computerCode ?? data.computerCode ?? fallbackComputerCode ?? null;

      if (sId !== null) {
        storage.setSessionId(sId);
      } else {
        storage.removeSessionId();
      }

      if (cCode !== null) {
        storage.setComputerCode(cCode);
      } else {
        storage.removeComputerCode();
      }

      set({
        user: data.account,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: sId,
        computerCode: cCode,
        role: data.account.role,
        isAuthenticated: true,
      });
    },

    setStaffAuth: (data: AuthResponse) => {
      storage.setAccessToken(data.accessToken);
      storage.setRefreshToken(data.refreshToken);
      storage.setUser(data.account);
      storage.removeSessionId();
      storage.removeComputerCode();

      set({
        user: data.account,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: null,
        computerCode: null,
        role: data.account.role,
        isAuthenticated: true,
      });
    },

    setSessionId: (sessionId: number | null) => {
      if (sessionId !== null) {
        storage.setSessionId(sessionId);
      } else {
        storage.removeSessionId();
      }
      set({ sessionId });
    },

    setComputerCode: (computerCode: string | null) => {
      if (computerCode) {
        storage.setComputerCode(computerCode);
      } else {
        storage.removeComputerCode();
      }
      set({ computerCode });
    },

    updateUser: (user: Account) => {
      storage.setUser(user);
      set({ user, role: user.role });
    },

    logout: async () => {
      const { refreshToken } = get();
      if (refreshToken) {
        try {
          await authApi.logout({ refreshToken });
        } catch {
          // Bỏ qua lỗi logout do server đã idempotent 204
        }
      }

      storage.clearAuth();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        sessionId: null,
        role: null,
        isAuthenticated: false,
      });
    },
  };
});
