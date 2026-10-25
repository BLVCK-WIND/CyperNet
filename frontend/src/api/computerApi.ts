import { axiosClient } from './axiosClient';
import type { ComputerResponse, GetComputersParams } from '@/types/computer';
import type { PageResponse } from '@/types/item';

export const computerApi = {
  /**
   * Lấy danh sách máy trạm có hỗ trợ lọc theo status, zone, keyword
   * Endpoint: GET /api/computers
   */
  getComputers(params: GetComputersParams = {}): Promise<PageResponse<ComputerResponse>> {
    return axiosClient.get('/api/computers', { params });
  },

  /**
   * Lấy chi tiết thông tin một máy trạm theo ID
   * Endpoint: GET /api/computers/{id}
   */
  getComputerById(id: number): Promise<ComputerResponse> {
    return axiosClient.get(`/api/computers/${id}`);
  },

  /**
   * Cập nhật máy trạm (đổi trạng thái, khu vực, giá)
   * Endpoint: PUT /api/computers/{id}
   */
  updateComputer(
    id: number,
    data: Partial<Omit<ComputerResponse, 'id'>>
  ): Promise<ComputerResponse> {
    return axiosClient.put(`/api/computers/${id}`, data);
  },
};
