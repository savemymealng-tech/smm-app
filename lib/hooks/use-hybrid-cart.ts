import { toast } from '@/components/ui/toast';
/**
 * Hybrid Cart: server cart when logged in (single source of truth), local when guest.
 * Checkout uses server cart (use_cart: true) when authenticated.
 */

import type { CartItem as LocalCartItem } from '@/types';
import type { AddToCartRequest, Meal } from '@/types/api';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useIsMutating,
} from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';

import { api } from '../api';
import { authAtom } from '../atoms/auth';
import { persistCartAtom, cartSyncAtom } from '../atoms/cart';
import { displayItems, stockAvailable } from '../cart-display';

export function useHybridCart() {
  const auth = useAtomValue(authAtom);
  const client = useQueryClient();
  const [localCart, setLocalCart] = useAtom(persistCartAtom);
  const [sync, setSync] = useAtom(cartSyncAtom);
  const activeMutations = useIsMutating({ mutationKey: ['cart-mutation'] });
  const result = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.cart.getCart(),
    enabled: auth.isAuthenticated,
    staleTime: 30000,
    refetchOnMount: 'always',
  });
  const cart = useMemo(
    () => (auth.isAuthenticated ? displayItems(result.data) : localCart),
    [auth.isAuthenticated, result.data, localCart],
  );
  const subtotal = auth.isAuthenticated
    ? Number(result.data?.subtotal || 0)
    : cart.reduce((sum, i) => sum + i.totalPrice, 0);
  return {
    cart,
    totalItems: cart.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    deliveryFee: auth.isAuthenticated
      ? Number(result.data?.delivery_fee || 0)
      : 0,
    serviceFee: auth.isAuthenticated
      ? Number(result.data?.service_fee || 0)
      : 0,
    tax: auth.isAuthenticated ? Number(result.data?.tax || 0) : 0,
    isLoading: auth.isAuthenticated && result.isLoading,
    isFetching: auth.isAuthenticated && result.isFetching,
    isError: auth.isAuthenticated && result.isError,
    error: result.error,
    isAuthenticated: auth.isAuthenticated,
    refetch: async () => {
      if (auth.isAuthenticated) return result.refetch();
    },
    isUpdating: activeMutations > 0 || sync.pending,
    isSyncing: sync.pending,
    syncError: sync.error,
    savedItems: auth.isAuthenticated ? localCart.length : 0,
    retrySync: () => {
      void client.invalidateQueries({ queryKey: ['profile'] });
      setSync((s) => ({ ...s, error: '', attempt: s.attempt + 1 }));
    },
    discardSaved: async () => {
      await setLocalCart([]);
      setSync((s) => ({ ...s, error: '' }));
    },
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
    mutationKey: ['cart-mutation'],
    mutationFn: (data: AddToCartRequest) => api.cart.addToCart(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(
        'Could not add item',
        error.error || error.message || 'Failed to add to cart',
      );
    },
  });

  const addToLocalCart = async (
    product: Meal,
    quantity: number,
    fulfillmentMethod?: 'pickup' | 'delivery',
  ) => {
    await setLocalCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => Number(item.productId) === product.id,
      );
      const price = parseFloat(product.price);

      // Determine if fulfillment choice is required
      const requiresChoice =
        product.available_for_pickup && product.available_for_delivery;

      // Auto-select fulfillment method if only one option available
      let finalFulfillmentMethod = fulfillmentMethod;
      if (!finalFulfillmentMethod) {
        if (product.available_for_delivery && !product.available_for_pickup) {
          finalFulfillmentMethod = 'delivery';
        } else if (
          product.available_for_pickup &&
          !product.available_for_delivery
        ) {
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
                fulfillment_method:
                  finalFulfillmentMethod ?? item.fulfillment_method,
                requires_fulfillment_choice:
                  requiresChoice && !finalFulfillmentMethod,
              }
            : item,
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
    // toast.success('Added to Cart', 'Item added to cart'); // Removed per user request
  };

  return {
    mutate: (data: AddToCartRequest & { product?: Meal }) => {
      if (data.product) {
        if (authState.isAuthenticated) {
          apiMutation.mutate(
            {
              product_id: data.product_id,
              quantity: data.quantity,
              fulfillment_method: data.fulfillment_method,
            },
            {
              // onSuccess: () => toast.success('Added to Cart', 'Item added to cart'), // Removed per user request
            },
          );
        } else {
          addToLocalCart(data.product, data.quantity, data.fulfillment_method);
        }
      }
    },
    mutateAsync: async (data: AddToCartRequest & { product: Meal }) => {
      if (authState.isAuthenticated)
        return apiMutation.mutateAsync({
          product_id: data.product_id,
          quantity: data.quantity,
          fulfillment_method: data.fulfillment_method,
        });
      const existing = localCart
        .filter((item) => Number(item.productId) === data.product_id)
        .reduce((sum, item) => sum + item.quantity, 0);
      if (existing + data.quantity > data.product.quantity_available)
        throw new Error('This quantity is no longer available');
      await addToLocalCart(
        data.product,
        data.quantity,
        data.fulfillment_method,
      );
    },
    isPending: apiMutation.isPending,
    isSuccess: apiMutation.isSuccess,
    isError: apiMutation.isError,
  };
}

type QuantityChange = {
  product_id?: number;
  item_id?: string;
  quantity: number;
  fulfillment_method?: 'pickup' | 'delivery';
};
function errorMessage(error: unknown) {
  const e = error as { error?: string; message?: string };
  return (
    e?.error || e?.message || 'Unable to update your cart. Please try again.'
  );
}
export function useHybridUpdateCart() {
  const auth = useAtomValue(authAtom);
  const [local, setLocal] = useAtom(persistCartAtom);
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const mutation = useMutation({
    mutationKey: ['cart-mutation'],
    mutationFn: api.cart.updateCart,
    onSuccess: (data) => client.setQueryData(['cart'], data),
  });
  const mutateAsync = async (data: QuantityChange) => {
    if (!Number.isSafeInteger(data.quantity) || data.quantity < 1)
      throw new Error('Choose a valid quantity.');
    setPending(true);
    try {
      if (auth.isAuthenticated && data.product_id)
        return await mutation.mutateAsync({
          product_id: data.product_id,
          quantity: data.quantity,
          fulfillment_method: data.fulfillment_method,
        });
      const item = local.find(
        (i) => i.id === data.item_id || Number(i.productId) === data.product_id,
      );
      if (!item) throw new Error('This item is no longer in your cart.');
      const stock = stockAvailable(item.product);
      if (stock !== null && data.quantity > stock)
        throw new Error(`Only ${stock} available`);
      await setLocal((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: data.quantity,
                totalPrice: i.unitPrice * data.quantity,
                fulfillment_method:
                  data.fulfillment_method ?? i.fulfillment_method,
                requires_fulfillment_choice: data.fulfillment_method
                  ? false
                  : i.requires_fulfillment_choice,
              }
            : i,
        ),
      );
    } finally {
      setPending(false);
    }
  };
  return {
    mutateAsync,
    mutate: (data: QuantityChange) => {
      void mutateAsync(data).catch((error) =>
        toast.error('Could not update cart', errorMessage(error)),
      );
    },
    isPending: pending || mutation.isPending,
  };
}
export function useHybridRemoveFromCart() {
  const auth = useAtomValue(authAtom);
  const [, setLocal] = useAtom(persistCartAtom);
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const mutation = useMutation({
    mutationKey: ['cart-mutation'],
    mutationFn: (productId: number) =>
      api.cart.removeFromCart({ product_id: productId }),
    onSuccess: (data) => client.setQueryData(['cart'], data),
  });
  const mutateAsync = async (id: string, productId?: number) => {
    setPending(true);
    try {
      if (auth.isAuthenticated && productId != null)
        return await mutation.mutateAsync(productId);
      await setLocal((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setPending(false);
    }
  };
  return {
    mutateAsync,
    mutate: (id: string, productId?: number) => {
      void mutateAsync(id, productId).catch((error) =>
        toast.error('Could not remove item', errorMessage(error)),
      );
    },
    isPending: pending || mutation.isPending,
  };
}
export function useHybridClearCart() {
  const auth = useAtomValue(authAtom);
  const [, setLocal] = useAtom(persistCartAtom);
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const mutation = useMutation({
    mutationKey: ['cart-mutation'],
    mutationFn: api.cart.clearCart,
    onSuccess: (data) => client.setQueryData(['cart'], data),
  });
  const mutateAsync = async () => {
    setPending(true);
    try {
      if (auth.isAuthenticated) await mutation.mutateAsync();
      else await setLocal([]);
    } finally {
      setPending(false);
    }
  };
  return {
    mutateAsync,
    mutate: () => {
      void mutateAsync().catch((error) =>
        toast.error('Could not clear cart', errorMessage(error)),
      );
    },
    isPending: pending || mutation.isPending,
  };
}
