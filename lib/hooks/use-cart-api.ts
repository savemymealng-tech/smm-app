/**
 * Cart Hooks - API-based cart management
 * Uses backend cart endpoints per SaveMyMeal API Guide v2.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { AddToCartRequest, UpdateCartRequest, RemoveFromCartRequest } from '@/types/api';

/**
 * Get Cart from Backend
 */
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        return await api.cart.getCart();
      } catch (error: any) {
        // If cart is empty or not found, return empty cart structure
        if (error?.response?.status === 404) {
          return {
            items: [],
            total_items: 0,
            subtotal: '0.00',
          };
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Add Item to Cart
 */
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddToCartRequest) => api.cart.addToCart(data),
    onSuccess: (data) => {
      // Update cart query cache
      queryClient.setQueryData(['cart'], data);
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Update Cart Item Quantity
 */
export function useUpdateCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCartRequest) => api.cart.updateCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Remove Item from Cart
 */
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RemoveFromCartRequest) => api.cart.removeFromCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * Clear Entire Cart
 */
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.cart.clearCart(),
    onSuccess: () => {
      // Clear cart cache
      queryClient.setQueryData(['cart'], {
        items: [],
        total_items: 0,
        subtotal: '0.00',
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
