import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom } from "jotai";
import type { CartItem } from "../../types";

const STORAGE_KEY = "app_cart";

export const cartAtom = atom<CartItem[]>([]);

export const persistCartAtom = atom(
  (get) => get(cartAtom),
  async (get, set, update: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    const newCart =
      typeof update === "function" ? update(get(cartAtom)) : update;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCart));
    set(cartAtom, newCart);
  }
);

export const initCartAtom = atom(null, async (get, set) => {
  try {
    const storedCart = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedCart) {
      const cart = JSON.parse(storedCart);
      set(cartAtom, cart);
    }
  } catch (error) {
    console.error("Error initializing cart:", error);
  }
});
