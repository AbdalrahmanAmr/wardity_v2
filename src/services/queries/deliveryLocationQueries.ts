import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export type DeliveryLocation = { id: string; name: string; nameAr: string; deliveryFee: number | null; requiresQuote: boolean; isActive?: boolean };
export const deliveryLocationQueryKey = ["delivery-locations"] as const;

export function useDeliveryLocations() {
  return useQuery({ queryKey: deliveryLocationQueryKey, queryFn: async () => (await api.get<{ data: DeliveryLocation[] }>("/delivery-locations")).data });
}
