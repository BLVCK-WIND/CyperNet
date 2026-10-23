export type PaymentMethod = 'CASH' | 'QR';

export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';

export interface CreateOrderItemRequest {
  itemId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  sessionId: number;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemRequest[];
}

export interface OrderItemResponse {
  id: number;
  itemId: number;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemImageUrl?: string;
  imageUrl?: string;
}

export interface OrderResponse {
  id: number;
  sessionId: number;
  computerCode: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  confirmedByStaffId: number | null;
  confirmedByStaffName: string | null;
  createdAt: string;
  confirmedAt: string | null;
  items: OrderItemResponse[];
}

export interface VietQrResponse {
  qrUrl: string;
  amount: string;
  content: string;
  bankId: string;
  accountNo: string;
}
