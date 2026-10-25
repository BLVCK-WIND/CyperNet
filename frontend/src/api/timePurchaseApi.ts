import { axiosClient } from './axiosClient';
import type {
  CreateTimePurchaseRequest,
  TimePurchaseResponse,
} from '@/types/timePurchase';

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
};
