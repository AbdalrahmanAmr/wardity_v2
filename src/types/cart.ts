/**
 * Shopping cart types
 */
import type { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  unavailable?: boolean;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}
