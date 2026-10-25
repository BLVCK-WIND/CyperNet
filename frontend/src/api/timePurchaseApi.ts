import { axiosClient } from './axiosClient';
import type {
  CreateTimePurchaseRequest,
  TimePurchaseResponse,
} from '@/types/timePurchase';
import type { PageResponse } from '@/types/item';

export const timePurchaseApi = {
  /**
   * Tạo phiếu nạp giờ chơi cho khách
   * Endpoint: POST /api/time-purchases
   */
  createTimePurchase(data: CreateTimePurchaseRequest): Promise<TimePurchaseResponse> {
    return axiosClient.post('/api/time-purchases', data);
  },

  /**
   * Thu ngân / Staff xác nhận nạp giờ
   * Staff ID được Backend trích xuất an toàn từ JWT Token
   * Endpoint: PATCH /api/time-purchases/{id}/confirm
   */
  confirmTimePurchase(id: number): Promise<TimePurchaseResponse> {
    return axiosClient.patch(`/api/time-purchases/${id}/confirm`);
  },

  /**
   * Hủy yêu cầu nạp giờ
   * Endpoint: PATCH /api/time-purchases/{id}/cancel
   */
  cancelTimePurchase(id: number): Promise<TimePurchaseResponse> {
    return axiosClient.patch(`/api/time-purchases/${id}/cancel`);
  },

  /**
   * Xem chi tiết một giao dịch nạp giờ
   * Endpoint: GET /api/time-purchases/{id}
   */
  getTimePurchaseById(id: number): Promise<TimePurchaseResponse> {
    return axiosClient.get(`/api/time-purchases/${id}`);
  },

  /**
   * Lấy danh sách giao dịch nạp giờ có phân trang & lọc trạng thái
   * Endpoint: GET /api/time-purchases
   */
  getTimePurchases(params: {
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<PageResponse<TimePurchaseResponse>> {
    return axiosClient.get('/api/time-purchases', { params });
  },
};
