import { axiosClient } from './axiosClient';
import type {
  ItemResponse,
  ItemType,
  PageResponse,
  CreateItemRequest,
  UpdateItemRequest,
  FileUploadResponse,
} from '@/types/item';

export interface GetItemsParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const itemApi = {
  /**
   * Lấy danh sách toàn bộ món ăn / dịch vụ (có phân trang)
   * Endpoint: GET /api/items
   */
  getAllItems(params: GetItemsParams = { page: 0, size: 50 }): Promise<PageResponse<ItemResponse>> {
    return axiosClient.get('/api/items', { params });
  },

  /**
   * Lấy danh sách món hàng theo loại (FOOD, DRINK, SERVICE, PLAYTIME)
   * Endpoint: GET /api/items/type/{type}
   */
  getItemsByType(
    type: ItemType,
    params: GetItemsParams = { page: 0, size: 50 }
  ): Promise<PageResponse<ItemResponse>> {
    return axiosClient.get(`/api/items/type/${type}`, { params });
  },

  /**
   * Xem chi tiết món theo ID
   * Endpoint: GET /api/items/{id}
   */
  getItemById(id: number): Promise<ItemResponse> {
    return axiosClient.get(`/api/items/${id}`);
  },

  /**
   * Thêm món mới vào thực đơn (ADMIN)
   * Endpoint: POST /api/items
   */
  createItem(data: CreateItemRequest): Promise<ItemResponse> {
    return axiosClient.post('/api/items', data);
  },

  /**
   * Cập nhật thông tin món ăn / gói giờ (ADMIN)
   * Endpoint: PUT /api/items/{id}
   */
  updateItem(id: number, data: UpdateItemRequest): Promise<ItemResponse> {
    return axiosClient.put(`/api/items/${id}`, data);
  },

  /**
   * Xóa món khỏi thực đơn (ADMIN)
   * Endpoint: DELETE /api/items/{id}
   */
  deleteItem(id: number): Promise<void> {
    return axiosClient.delete(`/api/items/${id}`);
  },

  /**
   * Tải tệp hình ảnh món ăn lên máy chủ (ADMIN / STAFF)
   * Endpoint: POST /api/files/upload?folder=items
   */
  uploadItemImage(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/api/files/upload?folder=items', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
