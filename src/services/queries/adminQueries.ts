import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { productQueryKeys } from "./productQueries";
import { categoryQueryKeys, occasionQueryKeys } from "./categoryQueries";
import type { Product, Category, Occasion } from "@/types";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  created_at: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  status: string;
  total: number | string | null;
  merchandise_subtotal?: number | string | null;
  delivery_location_name?: string | null;
  delivery_location_name_ar?: string | null;
  delivery_fee?: number | string | null;
  requested_delivery_date?: string | null;
  requested_delivery_time?: string | null;
  requires_shipping_quote?: boolean | number;
  shipping_address: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export const adminQueryKeys = {
  all: ["admin"] as const,
  products: () => [...adminQueryKeys.all, "products"] as const,
  users: () => [...adminQueryKeys.all, "users"] as const,
  orders: () => [...adminQueryKeys.all, "orders"] as const,
};

export function useAdminProducts() {
  return useQuery({
    queryKey: adminQueryKeys.products(),
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>("/admin/products");
      return response.data;
    },
  });
}

// Users
export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users(),
    queryFn: async () => {
      const response = await api.get<{ data: AdminUser[] }>("/admin/users");
      return response.data;
    },
  });
}

// Orders
export function useAdminOrders() {
  return useQuery({
    queryKey: adminQueryKeys.orders(),
    queryFn: async () => {
      const response = await api.get<{ data: AdminOrder[] }>("/admin/orders");
      return response.data;
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch<{ data: any }>(`/admin/orders/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() });
    },
  });
}

export function useResolveShippingQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deliveryFee }: { id: string; deliveryFee: number }) => api.patch(`/admin/orders/${id}/shipping-quote`, { deliveryFee }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders() }); },
  });
}

// Products
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await api.post<{ data: any }>("/admin/products", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const response = await api.patch<{ data: any }>(`/admin/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ data: any }>(`/admin/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
    },
  });
}

export function useBulkProductAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: string[]; action: "sale" | "out_of_stock"; salePrice?: number; salePercent?: number }) =>
      api.post("/admin/products/bulk", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all });
    },
  });
}

// Categories
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Category>) => {
      const response = await api.post<{ data: any }>("/admin/categories", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Category> & { id: string }) => {
      const response = await api.patch<{ data: any }>(`/admin/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ data: any }>(`/admin/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}

// Occasions
export function useCreateOccasion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Occasion>) => {
      const response = await api.post<{ data: any }>("/admin/occasions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: occasionQueryKeys.all });
    },
  });
}

export function useUpdateOccasion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Occasion> & { id: string }) => {
      const response = await api.patch<{ data: any }>(`/admin/occasions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: occasionQueryKeys.all });
    },
  });
}

export function useDeleteOccasion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ data: any }>(`/admin/occasions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: occasionQueryKeys.all });
    },
  });
}

// Stats
// TODO: Replace fetching full lists with a dedicated /api/admin/stats endpoint
// once the app scales to real production traffic.
export function useAdminStats() {
  const usersQuery = useAdminUsers();
  const ordersQuery = useAdminOrders();
  const productsQuery = useAdminProducts();

  const isLoading = usersQuery.isLoading || ordersQuery.isLoading || productsQuery.isLoading;
  const isError = usersQuery.isError || ordersQuery.isError || productsQuery.isError;

  return {
    isLoading,
    isError,
    data: {
      usersCount: usersQuery.data?.length || 0,
      ordersCount: ordersQuery.data?.length || 0,
      productsCount: productsQuery.data?.length || 0,
    }
  };
}
