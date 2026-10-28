import { axiosClient } from './axiosClient';
import type {
  ComputerResponse,
  GetComputersParams,
  CreateComputerRequest,
  UpdateComputerRequest,
} from '@/types/computer';
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
   * Tạo máy trạm mới (ADMIN / STAFF)
   * Endpoint: POST /api/computers
   */
  createComputer(data: CreateComputerRequest): Promise<ComputerResponse> {
    return axiosClient.post('/api/computers', data);
  },

  /**
   * Cập nhật máy trạm (đổi trạng thái, khu vực, giá)
   * Endpoint: PUT /api/computers/{id}
   */
  updateComputer(
    id: number,
    data: UpdateComputerRequest | Partial<Omit<ComputerResponse, 'id'>>
  ): Promise<ComputerResponse> {
    return axiosClient.put(`/api/computers/${id}`, data);
  },

  /**
   * Xóa máy trạm (ADMIN)
   * Endpoint: DELETE /api/computers/{id}
   */
  deleteComputer(id: number): Promise<void> {
    return axiosClient.delete(`/api/computers/${id}`);
  },
};
