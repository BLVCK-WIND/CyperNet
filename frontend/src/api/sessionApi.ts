import { axiosClient } from './axiosClient';
import type { ComputerCheckResponse } from '@/types/session';
import type { SessionResponse } from '@/types/auth';
import type { PageResponse } from '@/types/item';

export const sessionApi = {
  /**
   * Kiểm tra tình trạng máy công khai (Public QR check)
   * Endpoint: GET /api/sessions/check/{computerCode}
   */
  checkComputer(computerCode: string): Promise<ComputerCheckResponse> {
    return axiosClient.get(`/api/sessions/check/${encodeURIComponent(computerCode)}`);
  },

  /**
   * Tra cứu phiên chơi đang chạy theo mã máy trạm
   * Endpoint: GET /api/sessions/active/computer/{computerCode}
   */
  getActiveSession(computerCode: string): Promise<SessionResponse> {
    return axiosClient.get(`/api/sessions/active/computer/${encodeURIComponent(computerCode)}`);
  },

  /**
   * Lấy danh sách các phiên chơi (dành cho Staff / Admin lọc theo status, polling)
   * Endpoint: GET /api/sessions
   */
  getSessions(params: {
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<PageResponse<SessionResponse>> {
    return axiosClient.get('/api/sessions', { params });
  },

  /**
   * Lấy lịch sử tất cả phiên chơi của 1 máy tính có phân trang (mặc định 5 phiên mới nhất)
   * Endpoint: GET /api/sessions/computer/{computerId}
   */
  getSessionsByComputerId(
    computerId: number,
    params: { page?: number; size?: number; sort?: string } = { page: 0, size: 5 }
  ): Promise<PageResponse<SessionResponse>> {
    return axiosClient.get(`/api/sessions/computer/${computerId}`, { params });
  },

  /**
   * Nhân viên mở phiên chơi tại quầy theo Phương án A (dùng toàn bộ số dư khả dụng của khách)
   * Endpoint: POST /api/sessions/start
   */
  startSession(data: { computerId: number; accountId: number }): Promise<SessionResponse> {
    return axiosClient.post('/api/sessions/start', data);
  },

  /**
   * Kết thúc phiên chơi (hoàn trả 100% phút dư, trả máy về AVAILABLE)
   * Endpoint: PATCH /api/sessions/{id}/end
   */
  endSession(sessionId: number): Promise<SessionResponse> {
    return axiosClient.patch(`/api/sessions/${sessionId}/end`);
  },

  /**
   * Gia hạn thêm giờ chơi cho phiên đang hoạt động
   * Endpoint: PATCH /api/sessions/{id}/extend
   */
  extendSession(sessionId: number, extraMinutes: number): Promise<SessionResponse> {
    return axiosClient.patch(`/api/sessions/${sessionId}/extend`, { extraMinutes });
  },

  /**
   * Chuyển phiên chơi sang máy trạm khác
   * Endpoint: PATCH /api/sessions/{id}/transfer
   */
  transferSession(
    sessionId: number,
    data: {
      toComputerId: number;
      markOldAsMaintenance?: boolean;
      reason?: string;
    }
  ): Promise<SessionResponse> {
    return axiosClient.patch(`/api/sessions/${sessionId}/transfer`, data);
  },
};
