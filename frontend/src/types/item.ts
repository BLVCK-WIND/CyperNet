export type ItemType = 'FOOD' | 'DRINK' | 'SERVICE' | 'PLAYTIME';

export interface ItemResponse {
  id: number;
  name: string;
  price: number;
  available: boolean;
  type: ItemType;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}
