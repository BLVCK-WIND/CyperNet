import { axiosClient } from './axiosClient';
import type { Account, Role } from '@/types/auth';
import type { PageResponse } from '@/types/item';

export interface GetAccountsParams {
  role?: Role | string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const accountApi = {
  /**
   * Lấy danh sách tài khoản phân trang (có thể lọc theo role CUSTOMER, STAFF, ADMIN)
   * Endpoint: GET /api/accounts
   */
  getAccounts(params: GetAccountsParams = {}): Promise<PageResponse<Account>> {
    return axiosClient.get('/api/accounts', { params });
  },

  /**
   * Lấy chi tiết tài khoản theo ID
   * Endpoint: GET /api/accounts/{id}
   */
  getAccountById(id: number): Promise<Account> {
    return axiosClient.get(`/api/accounts/${id}`);
  },
};
