import { atom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserLocation = {
  coords?: { latitude: number; longitude: number };
  city?: string;
  address?: string;
  source?: "gps" | "manual";
  timestamp: number;
} | null;
export const locationAtom = atom<UserLocation>(null);
export const addressAtom = atom<string | null>(null);
export const locationReadyAtom = atom(false);
export const locationRevisionAtom = atom(0);
const key = "smm_browsing_location_v1";
export const initializeLocationAtom = atom(null, async (get, set) => {
  const revision = get(locationRevisionAtom);
  try {
    const value = await AsyncStorage.getItem(key);
    if (
      value &&
      get(locationRevisionAtom) === revision &&
      !get(locationReadyAtom)
    ) {
      const saved = JSON.parse(value);
      const coords = saved.coords;
      const validCoords =
        coords &&
        Number.isFinite(coords.latitude) &&
        Number.isFinite(coords.longitude) &&
        Math.abs(coords.latitude) <= 90 &&
        Math.abs(coords.longitude) <= 180;
      if (
        saved.source === "manual" &&
        (validCoords || typeof saved.city === "string")
      ) {
        set(locationAtom, {
          ...saved,
          coords: validCoords ? coords : undefined,
        });
      }
    }
  } catch {
    /* Browsing remains available if storage is unavailable. */
  }
  set(locationReadyAtom, true);
});
export const selectBrowsingLocationAtom = atom(
  null,
  (get, set, value: UserLocation) => {
    set(locationRevisionAtom, get(locationRevisionAtom) + 1);
    set(locationAtom, value);
    set(locationReadyAtom, true);
    // Serialize writes so a slow earlier selection cannot overwrite the latest one.
    storageWrite = storageWrite
      .catch(() => {})
      .then(() =>
        value?.source === "manual"
          ? AsyncStorage.setItem(key, JSON.stringify(value))
          : AsyncStorage.removeItem(key),
      );
    void storageWrite.catch(() => {});
  },
);
let storageWrite: Promise<void> = Promise.resolve();
