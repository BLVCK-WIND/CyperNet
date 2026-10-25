export type PaymentMethod = 'CASH' | 'QR';

export type TimePurchaseStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';

export interface CreateTimePurchaseRequest {
  accountId: number;
  minutes: number;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface TimePurchaseResponse {
  id: number;
  accountId: number;
  accountName: string;
  accountPhone: string;
  minutes: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TimePurchaseStatus;
  confirmedByStaffId: number | null;
  confirmedByStaffName: string | null;
  createdAt: string;
  confirmedAt: string | null;
}
