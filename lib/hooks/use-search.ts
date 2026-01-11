import { useQuery } from "@tanstack/react-query";
import type { Filter, SearchResult } from "../../types";
import { api } from "../api";

export function useSearch(query: string, filters?: Filter) {
  return useQuery({
    queryKey: ["search", query, filters],
    queryFn: async () => {
      // Use meals browse endpoint with search filter
      const mealsResult = await api.meals.browseMeals({
        search: query,
        filter: query,
        min_price: filters?.priceRange?.[0],
        max_price: filters?.priceRange?.[1],
        category: filters?.categories?.[0],
        categories: filters?.categories?.join(','),
        vendor_rating_min: filters?.minRating,
      });
      
      // Get vendors that match the search
      const vendorsResult = await api.vendors.getVendors({
        min_rating: filters?.minRating,
        is_open: filters?.isOpen,
      });
      
      // Filter vendors by search query
      const filteredVendors = vendorsResult.vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(query.toLowerCase()) ||
        vendor.description.toLowerCase().includes(query.toLowerCase()) ||
        vendor.cuisine.some(c => c.toLowerCase().includes(query.toLowerCase()))
      );
      
      const result: SearchResult = {
        vendors: filteredVendors,
        products: mealsResult.meals,
        total: filteredVendors.length + mealsResult.meals.length,
      };
      
      return result;
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}
