import type { ComputerZone } from '@/types/computer';

export interface ComputerCheckResponse {
  computerCode: string;
  zone: ComputerZone;
  pricePerHour: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  hasActiveSession: boolean;
}
