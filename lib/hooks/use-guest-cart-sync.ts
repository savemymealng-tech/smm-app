import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAtom, useAtomValue, useStore } from 'jotai';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from './use-profile';
import { api } from '@/lib/api';
import { authAtom } from '@/lib/atoms/auth';
import { cartReadyAtom, cartSyncAtom, persistCartAtom } from '@/lib/atoms/cart';
import { syncGuestCart } from '@/lib/cart-sync';
export function useGuestCartSync() {
  const auth = useAtomValue(authAtom);
  const ready = useAtomValue(cartReadyAtom);
  const items = useAtomValue(persistCartAtom);
  const [state, setState] = useAtom(cartSyncAtom);
  const store = useStore();
  const client = useQueryClient();
  const profile = useProfile();
  const userId = auth.user?.id ?? profile.data?.id;
  const signature = JSON.stringify(items.map((i) => [i.id, i.quantity]));
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setState((s) => ({ ...s, pending: false, error: '' }));
      return;
    }
    if (
      ready &&
      items.length &&
      !userId &&
      profile.isError &&
      !profile.isFetching
    ) {
      if (!state.error)
        setState((s) => ({
          ...s,
          error:
            'Unable to load your account to sync saved items. Please retry.',
        }));
      return;
    }
    if (!ready || !userId || !items.length || state.pending || state.error)
      return;
    const active = () => {
      const a = store.get(authAtom);
      return (
        a.isAuthenticated && (!a.user || String(a.user.id) === String(userId))
      );
    };
    setState((s) => ({ ...s, pending: true, error: '' }));
    void syncGuestCart({
      userId: String(userId),
      items,
      api: api.cart,
      storage: AsyncStorage,
      isActive: active,
      onMerged: async (id, quantity) => {
        if (!active()) return;
        await store.set(persistCartAtom, (prev) =>
          prev.flatMap((i) =>
            i.id !== id
              ? [i]
              : i.quantity > quantity
                ? [
                    {
                      ...i,
                      quantity: i.quantity - quantity,
                      totalPrice: i.unitPrice * (i.quantity - quantity),
                    },
                  ]
                : [],
          ),
        );
      },
    })
      .then(async () => {
        if (active()) await client.invalidateQueries({ queryKey: ['cart'] });
      })
      .catch((error) => {
        if (active())
          setState((s) => ({
            ...s,
            error:
              error?.error ||
              error?.message ||
              'Could not sync your saved cart. Please retry.',
          }));
      })
      .finally(() => {
        if (active()) setState((s) => ({ ...s, pending: false }));
      });
  }, [
    auth.isAuthenticated,
    profile.isError,
    profile.isFetching,
    userId,
    ready,
    signature,
    state.pending,
    state.error,
    state.attempt,
    store,
    client,
    setState,
    items,
  ]);
}
