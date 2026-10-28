import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom } from 'jotai';
import type { CartItem } from '../../types';

const STORAGE_KEY = 'app_cart';
let writes: Promise<void> = Promise.resolve();
export const cartSyncAtom = atom({ pending: false, error: '', attempt: 0 });
export const cartReadyAtom = atom(false);

export const cartAtom = atom<CartItem[]>([]);

export const persistCartAtom = atom(
  (get) => get(cartAtom),
  async (get, set, update: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const newCart =
      typeof update === 'function' ? update(get(cartAtom)) : update;

    set(cartAtom, newCart);
    const write = writes
      .catch(() => {})
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCart)));
    writes = write;
    await write;
  },
);

export const initCartAtom = atom(null, async (get, set) => {
  const initial = get(cartAtom);
  try {
    const storedCart = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedCart && get(cartAtom) === initial) {
      const cart = JSON.parse(storedCart);
      set(cartAtom, cart);
    }
  } catch (error) {
    console.error('Error initializing cart:', error);
  } finally {
    set(cartReadyAtom, true);
  }
});
