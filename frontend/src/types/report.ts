import type { ComputerZone } from '@/types/computer';

export interface RevenueSummaryResponse {
  totalRevenue: number;
  totalOrderRevenue: number;
  totalTimePurchaseRevenue: number;
  totalFoodAndDrinkRevenue: number;
  totalPlaytimeRevenue: number;
  cashRevenue: number;
  qrRevenue: number;
  totalOrders: number;
  totalTimePurchases: number;
  fromDate: string;
  toDate: string;
}

export interface DailyRevenueResponse {
  date: string;
  orderRevenue: number;
  timePurchaseRevenue: number;
  totalRevenue: number;
  orderCount: number;
  timePurchaseCount: number;
}

export interface ComputerUsageResponse {
  computerId: number;
  computerCode: string;
  zone: ComputerZone;
  totalSessions: number;
  totalMinutesUsed: number;
}

export interface TopItemResponse {
  itemId: number;
  itemName: string;
  itemType: 'DRINK' | 'FOOD' | 'SERVICE' | 'PLAYTIME';
  totalQuantity: number;
  totalRevenue: number;
}

export interface TopCustomerResponse {
  accountId: number;
  name: string;
  phone: string;
  totalSpent: number;
  remainingMinutes: number;
  totalMinutesPlayed: number;
}

export interface ReportDateParams {
  fromDate?: string;
  toDate?: string;
}
