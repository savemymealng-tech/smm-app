import { useQuery } from '@tanstack/react-query'
import { api } from '../api/mockClient'
import type { Product } from '../../../types'

export function useProducts(vendorId?: string, category?: string) {
  return useQuery({
    queryKey: ['products', vendorId, category],
    queryFn: async () => {
      const response = await api.getProducts(vendorId, category)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.getProductById(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

