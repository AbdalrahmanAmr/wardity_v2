/**
 * Product-related React Query hooks and query keys
 */
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Product, ProductDetail, PaginatedResponse } from "@/types";

/**
 * Query keys factory for products
 */
export const productQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productQueryKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...productQueryKeys.lists(), filters] as const,
  details: () => [...productQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  search: (query: string, filters: ProductSearchFilters) =>
    [...productQueryKeys.all, "search", query, filters] as const,
};

export interface ProductSearchFilters {
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: "in-stock" | "out-of-stock";
  onSale?: boolean;
  sortBy?: "relevance" | "price-asc" | "price-desc" | "newest";
}

/**
 * Fetch single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productQueryKeys.detail(id),
    queryFn: () => api.get<ProductDetail>(`/products/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch products list with filters
 */
export function useProducts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: productQueryKeys.list(filters),
    queryFn: async () => {
      const queryString = filters
        ? `?${new URLSearchParams(
            Object.entries(filters).reduce(
              (acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                  acc[key] = String(value);
                }
                return acc;
              },
              {} as Record<string, string>,
            ),
          ).toString()}`
        : "";
      const res = await api.get<Product[] | { data: Product[] }>(
        `/products${queryString}`,
      );
      if (
        res &&
        typeof res === "object" &&
        "data" in res &&
        Array.isArray((res as { data: Product[] }).data)
      ) {
        return (res as { data: Product[] }).data;
      }
      return Array.isArray(res) ? res : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch paginated products
 */
export function useProductsInfinite(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [...productQueryKeys.all, "infinite", pageSize],
    queryFn: ({ pageParam = 1 }) =>
      api.get<PaginatedResponse<Product>>(
        `/products?page=${pageParam}&pageSize=${pageSize}`,
      ),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Search products
 */
export function useSearchProducts(
  query: string,
  filters: ProductSearchFilters = {},
) {
  const hasFilters = Boolean(
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.availability ||
    filters.onSale,
  );

  return useQuery({
    queryKey: productQueryKeys.search(query, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.availability)
        params.set("availability", filters.availability);
      if (filters.onSale) params.set("onSale", "true");
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      return api.get<Product[]>(`/products/search?${params.toString()}`);
    },
    enabled: query.length >= 2 || hasFilters,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  });
}
