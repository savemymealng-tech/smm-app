/**
 * Vendor hooks with filter support
 * Note: useNearbyVendors and useSearchVendors are exported from useVendors.ts
 */

import { useQuery } from "@tanstack/react-query";
import type { VendorParams } from "../../types";
import { api } from "../api";

/**
 * Hook to fetch a single vendor by ID
 * @param id - Vendor ID
 */
export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const vendor = await api.vendors.getVendorById(Number(id));
      return vendor;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch vendors with filter support
 * @param filters - Optional filters for vendors
 */
export function useVendorsFiltered(filters?: VendorParams) {
  return useQuery({
    queryKey: ["vendors", "filtered", filters],
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
