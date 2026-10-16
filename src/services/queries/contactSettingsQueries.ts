import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { ContactSettings, PublicContactSettings } from "@/types/contactSettings";

export const contactSettingsQueryKeys = { public: ["settings", "contact", "public"] as const, admin: ["admin", "settings", "contact"] as const };

export function usePublicContactSettings() {
  return useQuery({
    queryKey: contactSettingsQueryKeys.public,
    queryFn: async () => (await api.get<{ data: PublicContactSettings }>("/settings/contact")).data,
    staleTime: 60_000,
  });
}

export function useAdminContactSettings() {
  return useQuery({
    queryKey: contactSettingsQueryKeys.admin,
    queryFn: async () => (await api.get<{ data: ContactSettings }>("/admin/settings/contact")).data,
  });
}

export function useSaveContactSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: ContactSettings) => (await api.put<{ data: ContactSettings }>("/admin/settings/contact", settings)).data,
    onSuccess: (settings) => {
      queryClient.setQueryData(contactSettingsQueryKeys.admin, settings);
      queryClient.invalidateQueries({ queryKey: contactSettingsQueryKeys.public });
    },
  });
}
