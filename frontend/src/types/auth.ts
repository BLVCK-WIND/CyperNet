import type { ComputerZone } from '@/types/computer';

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface Account {
  id: number;
  phone: string;
  name: string;
  role: Role;
  remainingMinutes: number;
  createdAt: string;
}

export interface CreateAccountRequest {
  phone: string;
  name: string;
  password: string;
  role: Role;
}

export interface UpdateAccountRequest {
  name: string;
  password?: string;
  role: Role;
}

export interface SessionResponse {
  id: number;
  computerId: number;
  computerCode: string;
  computerZone: ComputerZone;
  pricePerHour: number;
  accountId: number;
  accountName: string;
  accountPhone: string;
  accountRemainingMinutes: number;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  status: 'ACTIVE' | 'ENDED';
  playedMinutes: number;
  remainingMinutesUntilExpiry: number;
  serverTime: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  account: Account;
  tokenType: string;
}

export interface CustomerAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  account: Account;
  session?: SessionResponse | null;
  computerCode?: string;
  computerZone?: ComputerZone | string;
  tokenType: string;
}

export interface CustomerLoginRequest {
  computerCode: string;
  phone: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface RegisterCustomerWithDepositRequest {
  phone: string;
  name: string;
  password?: string;
  initialDeposit: number;
  paymentMethod: 'CASH' | 'QR';
}

export interface RegisterCustomerResponse {
  account: Account;
  initialPurchase: {
    id: number;
    accountId: number;
    accountName: string;
    accountPhone: string;
    minutes: number;
    amount: number;
    paymentMethod: 'CASH' | 'QR';
    status: string;
    confirmedByStaffId: number | null;
    confirmedByStaffName: string | null;
    createdAt: string;
    confirmedAt: string | null;
  };
  initialPassword: string;
  message: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  status: number;
  errorCode: string;
  message: string;
  fieldErrors: FieldError[] | null;
  timestamp: string;
}
