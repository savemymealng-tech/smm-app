import { useQuery } from "@tanstack/react-query";
import type { VendorParams } from "../../types";
import { api } from "../api";

export function useVendors(filters?: VendorParams) {
  return useQuery({
    queryKey: ["vendors", filters],
    queryFn: async () => {
      // Map app filters to API params
      const params = {
        min_rating: filters?.minRating,
        is_open: filters?.isOpen,
        featured: filters?.featured,
        category: filters?.categories?.[0], // API expects single category or comma-separated
        categories: filters?.categories?.join(','),
        sort_by: filters?.sort === 'rating' ? 'rating' :
          filters?.sort === 'deliveryTime' ? 'delivery_time' :
            filters?.sort === 'distance' ? 'distance' : undefined,
        sort_order: filters?.sort ? ('desc' as const) : undefined,
        limit: filters?.limit,
      };

      const result = await api.vendors.getVendors(params);
      console.log("result", result);

      return result.vendors;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      return await api.vendors.getVendorById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
