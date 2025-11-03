import { useQuery } from "@tanstack/react-query";
import type { VendorParams } from "../../types";
import { api } from "../api/mockClient";

export function useVendors(filters?: VendorParams) {
  return useQuery({
    queryKey: ["vendors", filters],
    queryFn: async () => {
      const response = await api.getVendors(filters);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const response = await api.getVendorById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
