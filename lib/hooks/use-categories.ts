import { useQuery } from '@tanstack/react-query'
import { api } from "../api/mockClient";

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.getCategories()
      return response.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const response = await api.getCategoryById(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

