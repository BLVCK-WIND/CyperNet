export type ItemType = 'FOOD' | 'DRINK' | 'SERVICE' | 'PLAYTIME';

export interface ItemResponse {
  id: number;
  name: string;
  price: number;
  available: boolean;
  type: ItemType;
  imageUrl?: string;
}

export interface CreateItemRequest {
  name: string;
  price: number;
  available: boolean;
  type: ItemType;
  imageUrl?: string;
}

export interface UpdateItemRequest {
  name: string;
  price: number;
  available: boolean;
  type: ItemType;
  imageUrl?: string;
}

export interface FileUploadResponse {
  fileName: string;
  fileUrl: string;
  contentType: string;
  size: number;
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
