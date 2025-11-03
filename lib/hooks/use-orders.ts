import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/mockClient'
import { useAtom } from 'jotai'
import { persistCartAtom } from '../atoms/cart'
import type { Order } from '../../../types'

export function useOrders() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.getOrders('user-1')
      return response.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await api.getOrderById(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const [, clearCart] = useAtom(persistCartAtom)

  return useMutation({
    mutationFn: async (order: Partial<Order>) => {
      const response = await api.createOrder(order)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      clearCart([])
    },
  })
}

