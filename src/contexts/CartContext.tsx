import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/constants/storage";
import type { CartItem, Cart, Product } from "@/types";

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useLocalStorage<CartItem[]>(STORAGE_KEYS.CART, []);

  const calculateTotal = useCallback((items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + (item.product.isOnSale && item.product.salePrice ? item.product.salePrice : item.product.price) * item.quantity, 0);
  }, []);

  const calculateItemCount = useCallback((items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, []);

  const [cart, setCart] = useState<Cart>(() => ({
    items: cartItems,
    total: calculateTotal(cartItems),
    itemCount: calculateItemCount(cartItems),
  }));

  useEffect(() => {
    setCart({
      items: cartItems,
      total: calculateTotal(cartItems),
      itemCount: calculateItemCount(cartItems),
    });
  }, [cartItems, calculateTotal, calculateItemCount]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, selectedSize?: string) => {
      setCartItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => item.product.id === product.id && item.selectedSize === selectedSize
        );

        if (existingItemIndex >= 0) {
          const updatedItems = [...prevItems];
          const existingItem = updatedItems[existingItemIndex];
          if (existingItem) {
            if (existingItem.product.status === "Out of stock" || (existingItem.product.stockQuantity != null && existingItem.quantity + quantity > existingItem.product.stockQuantity)) {
              return prevItems;
            }
            updatedItems[existingItemIndex] = {
              ...existingItem,
              product: existingItem.product,
              quantity: existingItem.quantity + quantity,
            };
          }
          return updatedItems;
        }

        if (product.status === "Out of stock" || (product.stockQuantity != null && quantity > product.stockQuantity)) return prevItems;
        return [
          ...prevItems,
          {
            product,
            quantity,
            selectedSize,
          },
        ];
      });
    },
    [setCartItems]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    },
    [setCartItems]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [setCartItems, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, [setCartItems]);

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount: cart.itemCount,
    total: cart.total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
