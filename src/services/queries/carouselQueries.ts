import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface CarouselSlide {
  id: string;
  image: string;
  headline: string;
  headlineAr?: string | null;
  subHeadline?: string | null;
  subHeadlineAr?: string | null;
  ctaText: string;
  ctaTextAr?: string | null;
  ctaLink: string;
  sortOrder?: number;
  isVisible?: boolean;
}

export const carouselQueryKeys = {
  all: ["carousel"] as const,
  public: () => [...carouselQueryKeys.all, "public"] as const,
  admin: () => [...carouselQueryKeys.all, "admin"] as const,
};

export function useCarousel() {
  return useQuery({
    queryKey: carouselQueryKeys.public(),
    queryFn: () => api.get<CarouselSlide[]>("/carousel"),
    staleTime: 60 * 1000,
  });
}

export function useAdminCarousel() {
  return useQuery({
    queryKey: carouselQueryKeys.admin(),
    queryFn: async () => (await api.get<{ data: CarouselSlide[] }>("/admin/carousel")).data,
  });
}

export function useCreateCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CarouselSlide, "id" | "sortOrder">) => api.post<{ data: CarouselSlide }>("/admin/carousel", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carouselQueryKeys.all });
    },
  });
}

export function useUpdateCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CarouselSlide> & { id: string }) => api.patch<{ data: CarouselSlide }>(`/admin/carousel/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carouselQueryKeys.all });
    },
  });
}

export function useDeleteCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/carousel/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carouselQueryKeys.all });
    },
  });
}

export function useReorderCarouselSlides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.patch("/admin/carousel/reorder", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carouselQueryKeys.all });
    },
  });
}
