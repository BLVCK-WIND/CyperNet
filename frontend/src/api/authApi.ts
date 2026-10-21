import { axiosClient } from './axiosClient';
import type {
  CustomerLoginRequest,
  CustomerAuthResponse,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  LogoutRequest,
} from '@/types/auth';

export const authApi = {
  /**
   * Khách hàng quét mã QR tại bàn đăng nhập phiên bằng SĐT và mã máy
   * Endpoint: POST /api/auth/customer-session-login
   */
  customerSessionLogin(data: CustomerLoginRequest): Promise<CustomerAuthResponse> {
    return axiosClient.post('/api/auth/customer-session-login', data);
  },

  /**
   * Nhân viên thu ngân hoặc Quản trị viên đăng nhập
   * Endpoint: POST /api/auth/login
   */
  login(data: LoginRequest): Promise<AuthResponse> {
    return axiosClient.post('/api/auth/login', data);
  },

  /**
   * Cấp lại Access Token mới bằng Refresh Token
   * Endpoint: POST /api/auth/refresh
   */
  refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return axiosClient.post('/api/auth/refresh', data);
  },

  /**
   * Đăng xuất và thu hồi Refresh Token
   * Endpoint: POST /api/auth/logout
   */
  logout(data: LogoutRequest): Promise<void> {
    return axiosClient.post('/api/auth/logout', data);
  },
};
