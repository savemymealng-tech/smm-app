import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Alert } from 'react-native';
import type { PlaceOrderRequest } from '@/types/api';

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: PlaceOrderRequest) => api.orders.placeOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to place order');
    },
  });
}

export function useOrderHistory(page?: number, limit?: number, status?: string) {
  return useQuery({
    queryKey: ['orders', 'history', page, limit, status],
    queryFn: () => api.orders.getOrderHistory(),
  });
}

export function useTrackOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => api.orders.trackOrder(Number(orderId)),
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time tracking
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => api.orders.cancelOrder(Number(orderId)),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      Alert.alert('Success', 'Order cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to cancel order');
    },
  });
}
