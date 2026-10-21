import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/utils/storage';
import type { AuthResponse, ErrorResponse } from '@/types/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Queue for holding requests while a token refresh is in progress
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Bearer Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto Refresh Token on 401 & Extract Data
axiosClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If there is no response (Network error, CORS, timeout)
    if (!error.response) {
      const fallbackError: ErrorResponse = {
        status: 0,
        errorCode: 'NETWORK_ERROR',
        message: error.message || 'Không thể kết nối đến máy chủ',
        fieldErrors: null,
        timestamp: new Date().toISOString(),
      };
      return Promise.reject(fallbackError);
    }

    const { status, data } = error.response;

    // Check for 401 Unauthorized and attempt token rotation
    if (status === 401 && !originalRequest._retry) {
      // Avoid refreshing on login/refresh endpoints themselves
      if (
        originalRequest.url?.includes('/api/auth/login') ||
        originalRequest.url?.includes('/api/auth/customer-session-login') ||
        originalRequest.url?.includes('/api/auth/refresh')
      ) {
        return Promise.reject(data || error);
      }

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        storage.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(data || error);
      }

      if (isRefreshing) {
        // Another refresh is in progress, queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh API with clean axios call
        const response = await axios.post<AuthResponse>(
          `${baseURL}/api/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAuth = response.data;
        storage.setAccessToken(newAuth.accessToken);
        storage.setRefreshToken(newAuth.refreshToken);
        if (newAuth.account) {
          storage.setUser(newAuth.account);
        }

        processQueue(null, newAuth.accessToken);
        originalRequest.headers.Authorization = `Bearer ${newAuth.accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        storage.clearAuth();
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Return the structured ErrorResponse from backend
    return Promise.reject(data || error);
  }
);
