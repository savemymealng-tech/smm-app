import { api } from '@/lib/api';
import type { Order, PlaceOrderRequest, SubmitReviewRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: PlaceOrderRequest) => api.orders.placeOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      Alert.alert('Order Failed', error.error || error.message || 'Failed to place order');
    },
  });
}

export function useOrderHistory(page?: number, limit?: number, status?: string) {
  return useQuery({
    queryKey: ['orders', 'history', page, limit, status],
    queryFn: () => api.orders.getOrderHistory(),
  });
}

export function useTrackOrder(orderId: string, options?: { enabled?: boolean }) {
  // Validate that orderId can be converted to a valid number
  const isValidOrderId = Boolean(orderId && !isNaN(Number(orderId)));
  
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => {
      const orderNumber = Number(orderId);
      if (isNaN(orderNumber)) {
        throw new Error(`Invalid order ID: ${orderId}`);
      }
      return api.orders.trackOrder(orderNumber);
    },
    enabled: options?.enabled !== undefined 
      ? options.enabled && isValidOrderId 
      : isValidOrderId,
    retry: 2, // Retry failed requests twice
    refetchInterval: 30000, // Refetch every 30 seconds for real-time tracking
    staleTime: 5000, // Consider data fresh for 5 seconds
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      const orderNumber = Number(orderId);
      if (isNaN(orderNumber)) {
        throw new Error(`Invalid order ID: ${orderId}`);
      }
      return api.orders.cancelOrder(orderNumber);
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.error || error.message || 'Failed to cancel order');
    },
  });
}

/**
 * Hook to re-order items from a previous order
 * Clears the current cart and adds all items from the specified order
 */
export function useReorder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (order: Order) => {
      // Clear the current cart first
      try {
        await api.cart.clearCart();
      } catch (error) {
        // Cart might already be empty, continue anyway
        console.log('Cart clear skipped (may be empty)');
      }

      // Get items from order (handles both orderItems and items)
      const orderItems = order.orderItems || order.items || [];

      // Add each item from the order to the cart
      const addPromises = orderItems.map((item) =>
        api.cart.addToCart({
          product_id: item.product_id,
          quantity: item.quantity,
        })
      );

      // Add items sequentially to avoid race conditions
      for (const promise of addPromises) {
        await promise;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push('/(tabs)/cart');
    },
    onError: (error: any) => {
      Alert.alert('Reorder Failed', error.error || error.message || 'Failed to add items to cart. Some items may be unavailable.');
    },
  });
}

/**
 * Hook to submit a review for an order
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (reviewData: SubmitReviewRequest) => api.orders.submitReview(reviewData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', String(variables.order_id)] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.error || error.message || 'Failed to submit review. Please try again.');
    },
  });
}
