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
 * Always uses local storage, syncs with API in background when authenticated
 */
export function useHybridCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch API cart only when authenticated - to sync it to local storage
  const { data: apiCart, isLoading: apiLoading, refetch: refetchApiCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      console.log('useHybridCart - Fetching API cart for sync...');
      try {
        const result = await api.cart.getCart();
        console.log('useHybridCart - API cart fetched:', result);
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

  // Sync API cart to local storage when fetched (on login or refetch)
  useEffect(() => {
    if (authState.isAuthenticated && apiCart && !isSyncing) {
      const syncApiToLocal = () => {
        console.log('🔄 Syncing API cart to local storage...');
        
        if (apiCart.items && apiCart.items.length > 0) {
          // Convert API cart items to local cart format
          const localItems: LocalCartItem[] = apiCart.items.map((item) => ({
            id: `${item.product_id}-${Date.now()}`,
            productId: String(item.product_id),
            vendorId: String(item.product.vendor_id),
            product: item.product as any,
            quantity: item.quantity,
            customizations: {},
            unitPrice: parseFloat(item.product.price),
            totalPrice: parseFloat(item.product.price) * item.quantity,
          }));
          
          // Merge with existing local cart (avoid duplicates)
          setLocalCart((prev) => {
            const merged = [...prev];
            
            localItems.forEach((apiItem) => {
              const existingIndex = merged.findIndex(
                (localItem) => Number(localItem.productId) === Number(apiItem.productId)
              );
              
              if (existingIndex === -1) {
                // Item not in local cart, add it
                merged.push(apiItem);
              } else {
                // Item exists, use the one with higher quantity
                if (apiItem.quantity > merged[existingIndex].quantity) {
                  merged[existingIndex] = apiItem;
                }
              }
            });
            
            return merged;
          });
          
          console.log('✅ API cart synced to local storage');
        }
      };
      
      syncApiToLocal();
    }
  }, [authState.isAuthenticated, apiCart]);

  // Always return local cart calculations
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
    isLoading: isSyncing || (authState.isAuthenticated && apiLoading),
    isAuthenticated: authState.isAuthenticated,
    refetch: refetchApiCart,
  };
}

/**
 * Add to cart (always local first, syncs to API when logged in)
 */
export function useHybridAddToCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  // API mutation - only used when authenticated
  const apiMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => api.cart.addToCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to sync cart');
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
      if (data.product) {
        // Always add to local cart first
        addToLocalCart(data.product, data.quantity);
        
        // If authenticated, also sync to API in background
        if (authState.isAuthenticated) {
          apiMutation.mutate({ product_id: data.product_id, quantity: data.quantity });
        }
      }
    },
    isPending: apiMutation.isPending,
    isSuccess: apiMutation.isSuccess,
    isError: apiMutation.isError,
  };
}

/**
 * Update cart item (always local first, syncs to API when logged in)
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
      toast.error('Error', error.message || 'Failed to sync cart');
    },
  });

  return {
    mutate: (data: { product_id?: number; item_id?: string; quantity: number }) => {
      // Always update local cart first
      const itemId = data.item_id || `${data.product_id}-${Date.now()}`;
      setLocalCart((prev) => {
        if (data.quantity <= 0) {
          return prev.filter((item) => item.id !== itemId && Number(item.productId) !== data.product_id);
        }
        return prev.map((item) => {
          const matchesById = item.id === itemId;
          const matchesByProductId = data.product_id && Number(item.productId) === data.product_id;
          
          if (matchesById || matchesByProductId) {
            return {
              ...item,
              quantity: data.quantity,
              totalPrice: item.unitPrice * data.quantity,
            };
          }
          return item;
        });
      });
      
      // If authenticated, also sync to API in background
      if (authState.isAuthenticated && data.product_id) {
        apiMutation.mutate({ product_id: data.product_id, quantity: data.quantity });
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Remove from cart (always local first, syncs to API when logged in)
 */
export function useHybridRemoveFromCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: (productId: number) => api.cart.removeFromCart({ product_id: productId }),
    onSuccess: (data) => {
      console.log('🛒 useHybridRemoveFromCart - Success, updating cache with:', data);
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      console.error('🛒 useHybridRemoveFromCart - Error:', error);
      toast.error('Error', error.message || 'Failed to sync cart removal');
    },
  });

  return {
    mutate: (id: string) => {
      console.log('🛒 useHybridRemoveFromCart - Called with id:', id);
      console.log('🛒 useHybridRemoveFromCart - isAuthenticated:', authState.isAuthenticated);
      
      // Find the item to get its product ID for API sync
      const itemToRemove = localCart.find((item) => item.id === id);
      const productId = itemToRemove ? Number(itemToRemove.productId) : null;
      
      // Always remove from local cart first
      setLocalCart((prev) => prev.filter((item) => item.id !== id));
      
      toast.success('Item Removed', 'Item removed from cart');
      
      // If authenticated and we have a product id, also sync to API in background
      if (authState.isAuthenticated && productId) {
        console.log('🛒 useHybridRemoveFromCart - Syncing removal to API:', productId);
        apiMutation.mutate(productId);
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Clear cart (always local first, syncs to API when logged in)
 */
export function useHybridClearCart() {
  const authState = useAtomValue(authAtom);
  const [, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: () => api.cart.clearCart(),
    onSuccess: (data) => {
      console.log('🛒 useHybridClearCart - Success, updating cache with:', data);
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      console.error('🛒 useHybridClearCart - Error:', error);
      toast.error('Error', error.message || 'Failed to sync cart clear');
    },
  });

  return {
    mutate: () => {
      // Always clear local cart first
      console.log('🛒 useHybridClearCart - Clearing local cart');
      setLocalCart([]);
      toast.success('Cart Cleared', 'Your cart has been cleared');
      
      // If authenticated, also sync to API in background
      if (authState.isAuthenticated) {
        console.log('🛒 useHybridClearCart - Syncing clear to API');
        apiMutation.mutate();
      }
    },
    isPending: apiMutation.isPending,
  };
}
