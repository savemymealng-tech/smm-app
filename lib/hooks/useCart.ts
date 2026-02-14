import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => api.cart.getCart(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { product_id: number; quantity: number }) =>
      api.cart.addToCart(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Silent success - no notification
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to add item to cart');
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { product_id: number; quantity: number }) =>
      api.cart.updateCart(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to update cart');
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => api.cart.removeFromCart({ product_id: productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to remove item');
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.cart.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart Cleared', 'Your cart has been cleared');
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to clear cart');
    },
  });
}
