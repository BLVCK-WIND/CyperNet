import { axiosClient } from './axiosClient';
import type {
  RevenueSummaryResponse,
  DailyRevenueResponse,
  ComputerUsageResponse,
  TopItemResponse,
  ReportDateParams,
} from '@/types/report';

export const reportApi = {
  /**
   * Báo cáo tổng quan doanh thu (thực thu, F&B, nạp giờ, tỷ trọng Cash/QR)
   * GET /api/reports/revenue/summary
   */
  getRevenueSummary(params?: ReportDateParams): Promise<RevenueSummaryResponse> {
    return axiosClient.get('/api/reports/revenue/summary', { params });
  },

  /**
   * Chuỗi dữ liệu doanh thu theo ngày phục vụ biểu đồ xu hướng
   * GET /api/reports/revenue/daily
   */
  getDailyRevenue(params?: ReportDateParams): Promise<DailyRevenueResponse[]> {
    return axiosClient.get('/api/reports/revenue/daily', { params });
  },

  /**
   * Xếp hạng món bán chạy nhất
   * GET /api/reports/items/top-selling
   */
  getTopSellingItems(limit = 10, params?: ReportDateParams): Promise<TopItemResponse[]> {
    return axiosClient.get('/api/reports/items/top-selling', {
      params: { limit, ...params },
    });
  },

  /**
   * Thống kê hiệu suất và tần suất sử dụng máy trạm
   * GET /api/reports/computers/usage
   */
  getComputerUsage(params?: ReportDateParams): Promise<ComputerUsageResponse[]> {
    return axiosClient.get('/api/reports/computers/usage', { params });
  },
};
