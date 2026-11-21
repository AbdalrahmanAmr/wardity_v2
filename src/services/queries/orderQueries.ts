import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Order } from "@/types";

export const orderQueryKeys = {
  all: ["orders"] as const,
  list: () => [...orderQueryKeys.all, "list"] as const,
  listForUser: (userId: string) =>
    [...orderQueryKeys.all, "list", userId] as const,
  detail: (id: string) => [...orderQueryKeys.all, "detail", id] as const,
};

export function useOrders(enabled = true, userId?: string) {
  return useQuery({
    queryKey: userId
      ? orderQueryKeys.listForUser(userId)
      : orderQueryKeys.list(),
    queryFn: () => api.get<Order[]>("/orders"),
    enabled,
  });
}

export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => api.get<Order>(`/orders/${encodeURIComponent(id)}`),
    enabled: enabled && Boolean(id),
  });
}
