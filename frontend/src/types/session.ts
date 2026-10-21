export interface ComputerCheckResponse {
  computerCode: string;
  zone: 'STANDARD' | 'VIP';
  pricePerHour: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  hasActiveSession: boolean;
}
