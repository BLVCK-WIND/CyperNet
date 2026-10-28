import type { SessionResponse } from './auth';

export type ComputerStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type ComputerZone = 'STANDARD' | 'VIP' | 'STREAM' | 'ARENA' | 'COUPLE' | string;

export interface ComputerResponse {
  id: number;
  code: string;
  pricePerHour: number;
  ipAddress: string;
  zone: ComputerZone;
  status: ComputerStatus;
}

export interface CreateComputerRequest {
  code: string;
  pricePerHour: number;
  ipAddress: string;
  zone: string;
  status?: ComputerStatus;
}

export interface UpdateComputerRequest {
  code?: string;
  pricePerHour?: number;
  ipAddress?: string;
  zone: string;
  status?: ComputerStatus;
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
