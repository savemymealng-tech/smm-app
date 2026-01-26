/**
 * Hybrid Cart Hook
 * Uses local storage when not logged in, syncs to API when logged in
 */

import { toast } from '@/components/ui/toast';
import type { CartItem as LocalCartItem } from '@/types';
import type { AddToCartRequest, Meal, UpdateCartRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { authAtom } from '../atoms/auth';
import { persistCartAtom } from '../atoms/cart';

/**
 * Main hybrid cart hook
 * Automatically switches between local and API cart based on auth state
 */
export function useHybridCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch API cart only when authenticated
  const { data: apiCart, isLoading: apiLoading, refetch: refetchApiCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      console.log('useHybridCart - Fetching API cart...');
      try {
        const result = await api.cart.getCart();
        console.log('useHybridCart - API cart result type:', typeof result, 'isArray:', Array.isArray(result));
        console.log('useHybridCart - API cart result:', JSON.stringify(result, null, 2));
        return result;
      } catch (error: any) {
        console.log('useHybridCart - Error fetching cart:', error);
        if (error?.response?.status === 404) {
          console.log('useHybridCart - Cart not found, returning empty cart');
          return { items: [], total_items: 0, subtotal: '0.00' };
        }
        throw error;
      }
    },
    enabled: authState.isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Sync local cart to API when user logs in
  useEffect(() => {
    const syncLocalCartToApi = async () => {
      if (authState.isAuthenticated && localCart.length > 0 && !isSyncing) {
        setIsSyncing(true);
        console.log('🔄 Syncing local cart to API...', localCart.length, 'items');
        
        try {
          // Add each local cart item to API
          for (const item of localCart) {
            await api.cart.addToCart({
              product_id: Number(item.productId),
              quantity: item.quantity,
            });
          }
          
          // Clear local cart after successful sync
          setLocalCart([]);
          
          // Refetch API cart
          await refetchApiCart();
          
          toast.success('Cart Synced', 'Your cart has been synced!');
        } catch (error: any) {
          console.error('Cart sync error:', error);
          toast.warning('Sync Warning', 'Some items could not be synced to your cart.');
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncLocalCartToApi();
  }, [authState.isAuthenticated]);

  // Return API cart when logged in, local cart when not
  if (authState.isAuthenticated) {
    console.log('useHybridCart - Returning API cart:');
    console.log('  - apiCart:', apiCart);
    console.log('  - apiCart type:', typeof apiCart, 'isArray:', Array.isArray(apiCart));
    console.log('  - apiCart?.items:', apiCart?.items);
    console.log('  - items length:', apiCart?.items?.length || 0);
    console.log('  - total_items:', apiCart?.total_items);
    console.log('  - subtotal:', apiCart?.subtotal);
    
    return {
      cart: apiCart?.items || [],
      totalItems: apiCart?.total_items || 0,
      subtotal: parseFloat(apiCart?.subtotal || '0'),
      deliveryFee: apiCart?.delivery_fee ? parseFloat(apiCart.delivery_fee) : 0,
      serviceFee: apiCart?.service_fee ? parseFloat(apiCart.service_fee) : 0,
      tax: apiCart?.tax ? parseFloat(apiCart.tax) : 0,
      isLoading: apiLoading || isSyncing,
      isAuthenticated: true,
      refetch: refetchApiCart,
    };
  }

  // Local cart calculations
  console.log('useHybridCart - Returning local cart:', localCart.length, 'items');
  const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = localCart.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    cart: localCart,
    totalItems,
    subtotal,
    deliveryFee: 0,
    serviceFee: 0,
    tax: 0,
    isLoading: false,
    isAuthenticated: false,
    refetch: async () => {},
  };
}

/**
 * Add to cart (local or API)
 */
export function useHybridAddToCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  // API mutation
  const apiMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => api.cart.addToCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to Cart', 'Item added to cart');
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to add item to cart');
    },
  });

  // Local mutation
  const addToLocalCart = (product: Meal, quantity: number) => {
    setLocalCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) => Number(item.productId) === product.id
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        return prev.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: item.unitPrice * (item.quantity + quantity),
              }
            : item
        );
      }

      // Add new item
      const price = parseFloat(product.price);
      const newItem: LocalCartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: String(product.id),
        vendorId: String(product.vendor_id),
        product: product as any, // Type conversion needed
        quantity,
        customizations: {},
        unitPrice: price,
        totalPrice: price * quantity,
      };

      return [...prev, newItem];
    });

    toast.success('Added to Cart', 'Item added to cart');
  };

  return {
    mutate: (data: AddToCartRequest & { product?: Meal }) => {
      if (authState.isAuthenticated) {
        apiMutation.mutate({ product_id: data.product_id, quantity: data.quantity });
      } else {
        if (data.product) {
          addToLocalCart(data.product, data.quantity);
        }
      }
    },
    isPending: apiMutation.isPending,
    isSuccess: apiMutation.isSuccess,
    isError: apiMutation.isError,
  };
}

/**
 * Update cart item (local or API)
 */
export function useHybridUpdateCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: (data: UpdateCartRequest) => api.cart.updateCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to update cart');
    },
  });

  return {
    mutate: (data: { product_id?: number; item_id?: string; quantity: number }) => {
      if (authState.isAuthenticated && data.product_id) {
        apiMutation.mutate({ product_id: data.product_id, quantity: data.quantity });
      } else if (data.item_id) {
        // Local cart update
        setLocalCart((prev) => {
          if (data.quantity <= 0) {
            return prev.filter((item) => item.id !== data.item_id);
          }
          return prev.map((item) =>
            item.id === data.item_id
              ? {
                  ...item,
                  quantity: data.quantity,
                  totalPrice: item.unitPrice * data.quantity,
                }
              : item
          );
        });
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Remove from cart (local or API)
 */
export function useHybridRemoveFromCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: (productId: number) => api.cart.removeFromCart({ product_id: productId }),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to remove item');
    },
  });

  return {
    mutate: (id: number | string) => {
      if (authState.isAuthenticated && typeof id === 'number') {
        apiMutation.mutate(id);
      } else {
        // Local cart remove
        setLocalCart((prev) => prev.filter((item) => item.id !== id));
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Clear cart (local or API)
 */
export function useHybridClearCart() {
  const authState = useAtomValue(authAtom);
  const [, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: () => api.cart.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(['cart'], {
        items: [],
        total_items: 0,
        subtotal: '0.00',
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart Cleared', 'Your cart has been cleared');
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to clear cart');
    },
  });

  return {
    mutate: () => {
      if (authState.isAuthenticated) {
        apiMutation.mutate();
      } else {
        setLocalCart([]);
        toast.success('Cart Cleared', 'Your cart has been cleared');
      }
    },
    isPending: apiMutation.isPending,
  };
}
