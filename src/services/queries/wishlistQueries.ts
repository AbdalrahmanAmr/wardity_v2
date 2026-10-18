/**
 * Wishlist-related React Query hooks and mutations
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Product } from "@/types";

/**
 * Query keys factory for wishlist
 */
export const wishlistQueryKeys = {
  all: ["wishlist"] as const,
  current: () => [...wishlistQueryKeys.all, "current"] as const,
  items: () => [...wishlistQueryKeys.all, "items"] as const,
  check: (productId: string) => [...wishlistQueryKeys.all, "check", productId] as const,
};

/**
 * Fetch current wishlist
 */
export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: wishlistQueryKeys.items(),
    queryFn: async () => {
      try {
        return await api.get<Product[]>("/wishlist");
      } catch (error) {
        // The local wishlist remains available when the authenticated API cannot be used.
        const apiError = error as { code?: number; message?: string };
        if ([0, 401, 403, 404].includes(apiError.code ?? -1)) {
          return [] as Product[];
        }
        throw error; // Re-throw other errors
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure - fallback to context
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Check if product is in wishlist
 */
export function useIsInWishlist(productId: string) {
  return useQuery({
    queryKey: wishlistQueryKeys.check(productId),
    queryFn: () => api.get<boolean>(`/wishlist/check/${productId}`),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Add product to wishlist mutation
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.post<Product, { productId: string }>(`/wishlist/items`, { productId }),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: wishlistQueryKeys.check(productId),
      });
    },
  });
}

/**
 * Remove product from wishlist mutation
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.delete(`/wishlist/items/${productId}`),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: wishlistQueryKeys.check(productId),
      });
    },
  });
}

/**
 * Toggle wishlist item (add if not present, remove if present)
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isInWishlist,
    }: {
      productId: string;
      isInWishlist: boolean;
    }) => {
      if (isInWishlist) {
        return api.delete(`/wishlist/items/${productId}`);
      } else {
        return api.post<Product>(`/wishlist/items`, { productId });
      }
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: wishlistQueryKeys.check(productId),
      });
    },
  });
}
