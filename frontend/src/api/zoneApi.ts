import { axiosClient } from './axiosClient';
import type { ZoneResponse, CreateZoneRequest, UpdateZoneRequest } from '@/types/zone';

export const zoneApi = {
  /**
   * Lấy danh sách tất cả khu vực (kèm số lượng máy trạm)
   * Endpoint: GET /api/zones
   */
  getAllZones(): Promise<ZoneResponse[]> {
    return axiosClient.get('/api/zones');
  },

  /**
   * Lấy danh sách khu vực đang hoạt động (phục vụ Dropdown chọn khi tạo máy hoặc lọc sơ đồ)
   * Endpoint: GET /api/zones/active
   */
  getActiveZones(): Promise<ZoneResponse[]> {
    return axiosClient.get('/api/zones/active');
  },

  /**
   * Xem thông tin chi tiết một khu vực theo ID
   * Endpoint: GET /api/zones/{id}
   */
  getZoneById(id: number): Promise<ZoneResponse> {
    return axiosClient.get(`/api/zones/${id}`);
  },

  /**
   * Tạo mới khu vực phòng máy (ADMIN)
   * Endpoint: POST /api/zones
   */
  createZone(data: CreateZoneRequest): Promise<ZoneResponse> {
    return axiosClient.post('/api/zones', data);
  },

  /**
   * Cập nhật thông tin khu vực (ADMIN)
   * Endpoint: PUT /api/zones/{id}
   */
  updateZone(id: number, data: UpdateZoneRequest): Promise<ZoneResponse> {
    return axiosClient.put(`/api/zones/${id}`, data);
  },

  /**
   * Xóa khu vực phòng máy (ADMIN)
   * Endpoint: DELETE /api/zones/{id}
   */
  deleteZone(id: number): Promise<void> {
    return axiosClient.delete(`/api/zones/${id}`);
  },
};
