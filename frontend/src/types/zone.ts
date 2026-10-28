export interface ZoneResponse {
  id: number;
  code: string;
  name: string;
  defaultPricePerHour: number;
  colorCode: string;
  description?: string;
  active: boolean;
  createdAt: string;
  totalComputers: number;
}

export interface CreateZoneRequest {
  code: string;
  name: string;
  defaultPricePerHour: number;
  colorCode?: string;
  description?: string;
  active?: boolean;
}

export interface UpdateZoneRequest {
  name: string;
  defaultPricePerHour: number;
  colorCode?: string;
  description?: string;
  active?: boolean;
}
