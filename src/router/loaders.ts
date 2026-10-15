/**
 * Route loaders for data prefetching
 * These run before components mount, improving perceived performance
 */
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/services/queryClient";
import { api } from "@/services/api";

/**
 * Loader for category page
 */
export async function categoryLoader({
  params,
}: LoaderFunctionArgs): Promise<unknown> {
  const slug = params.slug;
  if (!slug) {
    throw new Error("Category slug is required");
  }

  return queryClient.ensureQueryData({
    queryKey: ["categories", "detail", slug],
    queryFn: () => api.get(`/categories/${slug}`),
  });
}

/**
 * Loader for occasion page
 */
export async function occasionLoader({
  params,
}: LoaderFunctionArgs): Promise<unknown> {
  const slug = params.slug;
  if (!slug) {
    throw new Error("Occasion slug is required");
  }

  return queryClient.ensureQueryData({
    queryKey: ["occasions", "detail", slug],
    queryFn: () => api.get(`/occasions/${slug}`),
  });
}

