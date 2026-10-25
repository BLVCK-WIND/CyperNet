import type { SessionResponse } from './auth';

export type ComputerStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type ComputerZone = 'STANDARD' | 'VIP';

export interface ComputerResponse {
  id: number;
  code: string;
  pricePerHour: number;
  ipAddress: string;
  zone: ComputerZone;
  status: ComputerStatus;
}

export interface FloorMapComputerItem extends ComputerResponse {
  activeSession?: SessionResponse | null;
}

export interface GetComputersParams {
  status?: string;
  zone?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}
