/**
 * Hybrid Cart: server cart when logged in (single source of truth), local when guest.
 * Checkout uses server cart (use_cart: true) when authenticated.
 */

import { toast } from '@/components/ui/toast';
import type { CartItem as LocalCartItem } from '@/types';
import type { AddToCartRequest, Cart, Meal, UpdateCartRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { api } from '../api';
import { authAtom } from '../atoms/auth';
import { persistCartAtom } from '../atoms/cart';

/** Normalize API cart item to shared display shape (id, productId, vendorId, product, quantity, unitPrice, totalPrice) */
function apiCartToDisplayItems(apiCart: Cart | null | undefined): LocalCartItem[] {
  if (!apiCart?.items?.length) return [];
  return apiCart.items.map((item: any) => {
    const product = item.product || {};
    const price = parseFloat(String(product.price ?? item.price ?? 0));
    return {
      id: String(item.id ?? `${item.product_id}-${Date.now()}`),
      productId: String(item.product_id),
      vendorId: String(product.vendor_id ?? product.vendor?.id ?? ''),
      product: product as LocalCartItem['product'],
      quantity: item.quantity,
      customizations: {},
      unitPrice: price,
      totalPrice: price * item.quantity,
      fulfillment_method: item.fulfillment_method ?? null,
      requires_fulfillment_choice: item.requires_fulfillment_choice ?? false,
    };
  });
}

/**
 * Single source of truth: when authenticated use API cart, when guest use local.
 */
export function useHybridCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const { data: apiCart, isLoading: apiLoading, refetch: refetchApiCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        return await api.cart.getCart();
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return { items: [], total_items: 0, subtotal: '0.00' };
        }
        throw error;
      }
    },
    enabled: authState.isAuthenticated,
    staleTime: 60 * 1000,
    refetchOnMount: true,
  });

  // On login: merge local cart into API, then clear local (one-time sync). Reset merge flag on logout.
  const hasMergedRef = useRef(false);
  useEffect(() => {
    if (!authState.isAuthenticated) {
      hasMergedRef.current = false;
      return;
    }
    if (!localCart.length || hasMergedRef.current) return;
    hasMergedRef.current = true;
    (async () => {
      try {
        for (const item of localCart) {
          await api.cart.addToCart({ product_id: Number(item.productId), quantity: item.quantity });
        }
        setLocalCart([]);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      } catch (e) {
        hasMergedRef.current = false;
      }
    })();
  }, [authState.isAuthenticated, localCart.length]);

  const displayCart = useMemo(() => {
    if (authState.isAuthenticated && apiCart) {
      return apiCartToDisplayItems(apiCart);
    }
    return localCart;
  }, [authState.isAuthenticated, apiCart, localCart]);

  const totalItems = displayCart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = displayCart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate total delivery fees - only for items with fulfillment_method === 'delivery'
  // OR items that only support delivery (available_for_delivery && !available_for_pickup)
  const deliveryFee = useMemo(() => {
    return displayCart.reduce((sum, item) => {
      const product = item.product;
      
      // Skip if no delivery fee defined
      if (!product?.delivery_fee || !product?.available_for_delivery) {
        return sum;
      }
      
      // Include delivery fee if:
      // 1. Customer explicitly chose delivery, OR
      // 2. Product only supports delivery (not available for pickup)
      const shouldIncludeDeliveryFee = 
        item.fulfillment_method === 'delivery' || 
        (product.available_for_delivery && !product.available_for_pickup);
      
      if (shouldIncludeDeliveryFee) {
        return sum + parseFloat(product.delivery_fee);
      }
      
      return sum;
    }, 0);
  }, [displayCart]);

  return {
    cart: displayCart,
    totalItems,
    subtotal,
    deliveryFee,
    serviceFee: 0,
    tax: 0,
    isLoading: authState.isAuthenticated ? apiLoading : false,
    isAuthenticated: authState.isAuthenticated,
    refetch: refetchApiCart,
  };
}

/**
 * Add to cart: API when logged in (then refetch), local when guest.
 */
export function useHybridAddToCart() {
  const authState = useAtomValue(authAtom);
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => api.cart.addToCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to add to cart');
    },
  });

  const addToLocalCart = (product: Meal, quantity: number, fulfillmentMethod?: 'pickup' | 'delivery') => {
    setLocalCart((prev) => {
      const existingIndex = prev.findIndex((item) => Number(item.productId) === product.id);
      const price = parseFloat(product.price);
      
      // Determine if fulfillment choice is required
      const requiresChoice = product.available_for_pickup && product.available_for_delivery;
      
      // Auto-select fulfillment method if only one option available
      let finalFulfillmentMethod = fulfillmentMethod;
      if (!finalFulfillmentMethod) {
        if (product.available_for_delivery && !product.available_for_pickup) {
          finalFulfillmentMethod = 'delivery';
        } else if (product.available_for_pickup && !product.available_for_delivery) {
          finalFulfillmentMethod = 'pickup';
        }
      }
      
      if (existingIndex !== -1) {
        return prev.map((item, i) =>
          i === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                totalPrice: item.unitPrice * (item.quantity + quantity),
                fulfillment_method: finalFulfillmentMethod ?? item.fulfillment_method,
                requires_fulfillment_choice: requiresChoice && !finalFulfillmentMethod,
              }
            : item
        );
      }
      const newItem: LocalCartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: String(product.id),
        vendorId: String(product.vendor_id),
        product: product as any,
        quantity,
        customizations: {},
        unitPrice: price,
        totalPrice: price * quantity,
        fulfillment_method: finalFulfillmentMethod ?? null,
        requires_fulfillment_choice: requiresChoice && !finalFulfillmentMethod,
      };
      return [...prev, newItem];
    });
    toast.success('Added to Cart', 'Item added to cart');
  };

  return {
    mutate: (data: AddToCartRequest & { product?: Meal }) => {
      if (data.product) {
        if (authState.isAuthenticated) {
          apiMutation.mutate({ 
            product_id: data.product_id, 
            quantity: data.quantity,
            fulfillment_method: data.fulfillment_method 
          }, {
            onSuccess: () => toast.success('Added to Cart', 'Item added to cart'),
          });
        } else {
          addToLocalCart(data.product, data.quantity, data.fulfillment_method);
        }
      }
    },
    isPending: apiMutation.isPending,
    isSuccess: apiMutation.isSuccess,
    isError: apiMutation.isError,
  };
}

/**
 * Update quantity: API when logged in, local when guest.
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
    mutate: (data: { product_id?: number; item_id?: string; quantity: number; fulfillment_method?: 'pickup' | 'delivery' }) => {
      if (data.quantity <= 0) {
        // Handled as remove by caller
        return;
      }
      if (authState.isAuthenticated && data.product_id) {
        apiMutation.mutate({ 
          product_id: data.product_id, 
          quantity: data.quantity,
          fulfillment_method: data.fulfillment_method 
        });
      } else {
        const itemId = data.item_id ?? `${data.product_id}-`;
        setLocalCart((prev) =>
          prev.map((item) => {
            const match = item.id === itemId || (data.product_id && Number(item.productId) === data.product_id);
            if (match) {
              return { 
                ...item, 
                quantity: data.quantity, 
                totalPrice: item.unitPrice * data.quantity,
                fulfillment_method: data.fulfillment_method ?? item.fulfillment_method,
              };
            }
            return item;
          })
        );
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Remove item: API when logged in, local when guest.
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
    mutate: (id: string, productId?: number) => {
      if (authState.isAuthenticated && productId != null) {
        apiMutation.mutate(productId, { onSuccess: () => toast.success('Item Removed', 'Item removed from cart') });
      } else {
        setLocalCart((prev) => prev.filter((i) => i.id !== id));
        toast.success('Item Removed', 'Item removed from cart');
      }
    },
    isPending: apiMutation.isPending,
  };
}

/**
 * Clear cart: API when logged in, local when guest.
 */
export function useHybridClearCart() {
  const authState = useAtomValue(authAtom);
  const [, setLocalCart] = useAtom(persistCartAtom);
  const queryClient = useQueryClient();

  const apiMutation = useMutation({
    mutationFn: () => api.cart.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(['cart'], { items: [], total_items: 0, subtotal: '0.00' });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error('Error', error.message || 'Failed to clear cart');
    },
  });

  return {
    mutate: () => {
      if (authState.isAuthenticated) {
        apiMutation.mutate(undefined, { onSuccess: () => toast.success('Cart Cleared', 'Your cart has been cleared') });
      } else {
        setLocalCart([]);
        toast.success('Cart Cleared', 'Your cart has been cleared');
      }
    },
    isPending: apiMutation.isPending,
  };
}
