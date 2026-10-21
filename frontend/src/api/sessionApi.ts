import { axiosClient } from './axiosClient';
import type { ComputerCheckResponse } from '@/types/session';
import type { SessionResponse } from '@/types/auth';

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
};
