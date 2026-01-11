import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { useAtom } from 'jotai'
import { persistCartAtom } from '../atoms/cart'
import type { Order } from '../../types'
import type { PlaceOrderRequest } from '../api'

export function useOrders(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const result = await api.orders.getOrderHistory(params)
      return result.orders
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      return await api.orders.trackOrder(id)
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const [, setCart] = useAtom(persistCartAtom)

  return useMutation({
    mutationFn: async (orderData: PlaceOrderRequest) => {
      return await api.orders.placeOrder(orderData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Clear local cart after successful order
      setCart([])
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      return await api.orders.cancelOrder(orderId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

