import { axiosClient } from './axiosClient';
import type { CreateOrderRequest, OrderResponse, VietQrResponse } from '@/types/order';
import type { PageResponse } from '@/types/item';

export interface GetOrdersParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const orderApi = {
  /**
   * Tạo đơn đặt món / dịch vụ mới
   * Endpoint: POST /api/orders
   */
  createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    return axiosClient.post('/api/orders', data);
  },

  /**
   * Lấy lịch sử đơn hàng theo phiên của khách (IDOR protected)
   * Endpoint: GET /api/orders/session/{sessionId}
   */
  getOrdersBySession(
    sessionId: number,
    params: GetOrdersParams = { page: 0, size: 20 }
  ): Promise<PageResponse<OrderResponse>> {
    return axiosClient.get(`/api/orders/session/${sessionId}`, { params });
  },

  /**
   * Lấy danh sách đơn hàng lọc theo status (dành cho Staff / Admin)
   * Endpoint: GET /api/orders?status={status}&page={page}&size={size}
   */
  getOrders(params: {
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<PageResponse<OrderResponse>> {
    return axiosClient.get('/api/orders', { params });
  },

  /**
   * Sinh mã VietQR Napas247 động
   * Endpoint: GET /api/files/vietqr?amount={amount}&content={content}
   */
  generateVietQR(amount: number, content: string): Promise<VietQrResponse> {
    return axiosClient.get('/api/files/vietqr', {
      params: { amount, content },
    });
  },

  /**
   * Xác nhận đơn hàng (Dành cho Thu ngân / Staff / Admin)
   * Staff ID được Backend trích xuất an toàn từ JWT Token
   * Endpoint: PATCH /api/orders/{id}/confirm
   */
  confirmOrder(id: number): Promise<OrderResponse> {
    return axiosClient.patch(`/api/orders/${id}/confirm`);
  },

  /**
   * Hủy đơn hàng
   * Endpoint: PATCH /api/orders/{id}/cancel
   */
  cancelOrder(id: number): Promise<OrderResponse> {
    return axiosClient.patch(`/api/orders/${id}/cancel`);
  },
};
