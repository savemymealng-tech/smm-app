import { useQuery } from "@tanstack/react-query";
import type { Filter } from "../../types";
import { api } from "../api/mockClient";

export function useSearch(query: string, filters?: Filter) {
  return useQuery({
    queryKey: ["search", query, filters],
    queryFn: async () => {
      const response = await api.search(query, filters);
      return response.data;
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}
