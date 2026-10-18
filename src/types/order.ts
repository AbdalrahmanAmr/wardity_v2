export type OrderStatus =
  | "pending"
  | "awaiting_shipping_quote"
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
  total: number | null;
  merchandiseSubtotal?: number | null;
  deliveryLocationId?: string | null;
  deliveryLocationName?: string | null;
  deliveryLocationNameAr?: string | null;
  deliveryFee?: number | null;
  requestedDeliveryDate?: string | null;
  requestedDeliveryTime?: string | null;
  requiresShippingQuote?: boolean | number;
  shippingAddress: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
