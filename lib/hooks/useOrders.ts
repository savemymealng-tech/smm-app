import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import type { Order, PlaceOrderRequest, SubmitReviewRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: PlaceOrderRequest) => api.orders.placeOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Order Failed', error.message || 'Failed to place order');
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
      toast.success('Order Cancelled', 'Your order has been cancelled');
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to cancel order');
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

      // Add each item from the order to the cart
      const addPromises = order.items.map((item) =>
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
      toast.success('Items Added', 'Order items have been added to your cart');
      router.push('/(tabs)/cart');
    },
    onError: (error: any) => {
      toast.error('Reorder Failed', error.message || 'Failed to add items to cart. Some items may be unavailable.');
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
      toast.success('Review Submitted', 'Thank you for your feedback!');
      router.back();
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to submit review. Please try again.');
    },
  });
}
