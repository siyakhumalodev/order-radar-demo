// ──────────────────────────────────────────────
// Shared types for the Order Radar backend
// ──────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  riskScore: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
