import { axiosClient } from './axiosClient';
import type {
  Account,
  Role,
  RegisterCustomerWithDepositRequest,
  RegisterCustomerResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '@/types/auth';
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

  /**
   * Tạo tài khoản mới (Admin / Staff)
   * Endpoint: POST /api/accounts
   */
  createAccount(data: CreateAccountRequest): Promise<Account> {
    return axiosClient.post('/api/accounts', data);
  },

  /**
   * Đăng ký hội viên mới tại quầy POS kèm nạp tiền lần đầu (tối thiểu 10.000 VNĐ)
   * Endpoint: POST /api/accounts/register-with-deposit
   */
  registerWithDeposit(request: RegisterCustomerWithDepositRequest): Promise<RegisterCustomerResponse> {
    return axiosClient.post('/api/accounts/register-with-deposit', request);
  },

  /**
   * Cập nhật thông tin tài khoản hoặc đổi mật khẩu
   * Endpoint: PUT /api/accounts/{id}
   */
  updateAccount(
    id: number,
    data: UpdateAccountRequest
  ): Promise<Account> {
    return axiosClient.put(`/api/accounts/${id}`, data);
  },

  /**
   * Xóa tài khoản (Chỉ ADMIN)
   * Endpoint: DELETE /api/accounts/{id}
   */
  deleteAccount(id: number): Promise<void> {
    return axiosClient.delete(`/api/accounts/${id}`);
  },
};
