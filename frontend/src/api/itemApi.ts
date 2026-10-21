import { axiosClient } from './axiosClient';
import type { ItemResponse, ItemType, PageResponse } from '@/types/item';

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
};
