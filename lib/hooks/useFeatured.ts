import { useBrowsingArea } from "./use-browsing-area";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useFeaturedCategories() {
  return useQuery({
    queryKey: ["featured", "categories"],
    queryFn: () => api.featured.getFeaturedCategories(),
  });
}

export function useFeaturedProducts() {
  const area = useBrowsingArea();
  return useQuery({
    queryKey: ["featured", "products", area],
    queryFn: () => api.featured.getFeaturedProducts(20, area),
  });
}

export function useFeaturedVendors() {
  const area = useBrowsingArea();
  return useQuery({
    queryKey: ["featured", "vendors", area],
    queryFn: () => api.featured.getFeaturedVendors(20, area),
  });
}
