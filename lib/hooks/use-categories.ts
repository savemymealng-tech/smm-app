import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import type { Category } from "@/types";
type ApiCategory = { id: number; name: string; description?: string };
async function categories(): Promise<Category[]> {
  const response = await apiClient.get("/meals/categories");
  return (response.data.data as ApiCategory[]).map((category) => ({
    ...category,
    id: String(category.id),
    slug: category.name.toLowerCase().replace(/\s+/g, "-"),
  }));
}
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categories,
    staleTime: 10 * 60 * 1000,
  });
}
export function useCategory(id: string) {
  return useQuery({
    queryKey: ["category", id],
    enabled: !!id,
    queryFn: async () => {
      const result = (await categories()).find(
        (category) => category.id === id || category.slug === id,
      );
      if (!result) throw new Error("Category not found");
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });
}
