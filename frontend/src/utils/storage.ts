import type { Account } from '@/types/auth';

const TOKEN_KEY = 'cybernet_access_token';
const REFRESH_TOKEN_KEY = 'cybernet_refresh_token';
const SESSION_ID_KEY = 'cybernet_session_id';
const COMPUTER_CODE_KEY = 'cybernet_computer_code';
const USER_KEY = 'cybernet_user';

export const storage = {
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeAccessToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getSessionId(): number | null {
    const raw = localStorage.getItem(SESSION_ID_KEY);
    return raw ? Number(raw) : null;
  },

  setSessionId(id: number): void {
    localStorage.setItem(SESSION_ID_KEY, String(id));
  },

  removeSessionId(): void {
    localStorage.removeItem(SESSION_ID_KEY);
  },

  getComputerCode(): string | null {
    return localStorage.getItem(COMPUTER_CODE_KEY);
  },

  setComputerCode(code: string): void {
    localStorage.setItem(COMPUTER_CODE_KEY, code);
  },

  removeComputerCode(): void {
    localStorage.removeItem(COMPUTER_CODE_KEY);
  },

  getUser(): Account | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Account;
    } catch {
      return null;
    }
  },

  setUser(user: Account): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(COMPUTER_CODE_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
