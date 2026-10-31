import AsyncStorage from '@react-native-async-storage/async-storage';

export type Area = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  source?: 'google' | 'smm_city' | 'smm_vendor';
  resolved_at?: number;
};
export type RecentArea = Area & { searchText: string; usedAt: number };
export const GOOGLE_COORD_TTL = 29 * 86400000;
const historyKey = (scope: string) => `smm_recent_areas_v1:${scope}`;
export function newSearchSession() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const n = Math.floor(Math.random() * 16);
    return (c === 'x' ? n : (n & 3) | 8).toString(16);
  });
}
let devicePromise: Promise<string> | undefined;
export function locationDeviceId() {
  return (devicePromise ||= (async () => {
    try {
      const saved = await AsyncStorage.getItem('smm_location_device_v1');
      if (saved && /^[a-zA-Z0-9-]{16,80}$/.test(saved)) return saved;
      const value = newSearchSession();
      await AsyncStorage.setItem('smm_location_device_v1', value);
      return value;
    } catch {
      return newSearchSession();
    }
  })());
}
export function cleanRecent(value: unknown, now = Date.now()): RecentArea[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.searchText === 'string',
    )
    .slice(0, 10)
    .map((item) => {
      // Persist our own query text, never Google's suggestion/address text.
      if (item.source !== 'google') return item;
      const valid =
        Number.isFinite(item.resolved_at) &&
        item.resolved_at <= now &&
        now - item.resolved_at < GOOGLE_COORD_TTL;
      return {
        id: item.id,
        place_id: item.place_id,
        name: item.searchText,
        searchText: item.searchText,
        source: 'google',
        usedAt: item.usedAt,
        ...(valid
          ? {
              latitude: item.latitude,
              longitude: item.longitude,
              resolved_at: item.resolved_at,
            }
          : {}),
      };
    });
}
export async function loadRecentAreas(scope = 'guest'): Promise<RecentArea[]> {
  try {
    const values = cleanRecent(
      JSON.parse((await AsyncStorage.getItem(historyKey(scope))) || '[]'),
    );
    await AsyncStorage.setItem(historyKey(scope), JSON.stringify(values));
    return values;
  } catch {
    return [];
  }
}
export async function saveRecentAreas(values: RecentArea[], scope = 'guest') {
  try {
    await AsyncStorage.setItem(
      historyKey(scope),
      JSON.stringify(cleanRecent(values)),
    );
  } catch {
    /* Optional history. */
  }
}
export function filterRecent(values: RecentArea[], q: string) {
  const text = q.trim().toLowerCase();
  return cleanRecent(values).filter((item) =>
    `${item.searchText} ${item.source === 'google' ? '' : item.city || ''}`
      .toLowerCase()
      .includes(text),
  );
}
