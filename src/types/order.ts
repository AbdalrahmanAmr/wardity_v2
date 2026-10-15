export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out for delivery"
  | "delivered"
  | "cancelled"
  | "processing"
  | "shipped";

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  product: {
    id: string;
    name: string;
    image: string;
    sku?: string | null;
  };
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  shippingAddress: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
