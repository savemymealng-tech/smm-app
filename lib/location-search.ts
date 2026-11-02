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
// Serialize reads that prune expired data with writes, including rapid reopen/clear.
let historyWork: Promise<unknown> = Promise.resolve();
function historyTask<T>(work: () => Promise<T>): Promise<T> {
  const next = historyWork.catch(() => {}).then(work);
  historyWork = next;
  return next;
}
export function resolvedSearchArea(
  area: Area,
  payload: Partial<Area>,
  now = Date.now(),
): Area {
  const numeric = (value: unknown) =>
    typeof value === 'number' || (typeof value === 'string' && value.trim())
      ? Number(value)
      : NaN;
  const latitude = numeric(payload.latitude);
  const longitude = numeric(payload.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new Error(
      'This place did not return valid coordinates. Please select another result.',
    );
  }
  return {
    ...area,
    ...payload,
    id: area.id,
    place_id: area.place_id,
    name: area.name,
    source: area.place_id ? 'google' : area.source,
    latitude,
    longitude,
    // Receipt time avoids server/device clock skew. Only call this for a fresh lookup.
    resolved_at: now,
  };
}
async function readHistory(scope: string) {
  const raw = await AsyncStorage.getItem(historyKey(scope));
  try {
    return cleanRecent(JSON.parse(raw || '[]'));
  } catch {
    return [];
  } // A corrupt old entry must not permanently prevent saving.
}

export async function loadRecentAreas(scope = 'guest'): Promise<RecentArea[]> {
  return historyTask(async () => {
    try {
      const values = await readHistory(scope);
      await AsyncStorage.setItem(historyKey(scope), JSON.stringify(values));
      return values;
    } catch {
      return [];
    }
  });
}
export async function saveRecentAreas(values: RecentArea[], scope = 'guest') {
  return historyTask(async () => {
    try {
      await AsyncStorage.setItem(
        historyKey(scope),
        JSON.stringify(cleanRecent(values)),
      );
    } catch {
      /* History is optional for browsing. */
    }
  });
}
export async function rememberRecentArea(item: RecentArea, scope = 'guest') {
  return historyTask(async () => {
    let values = cleanRecent([item]);
    try {
      const previous = await readHistory(scope);
      values = cleanRecent([
        item,
        ...previous.filter((area) => area.id !== item.id),
      ]);
      await AsyncStorage.setItem(historyKey(scope), JSON.stringify(values));
      return { values, saved: true };
    } catch {
      return { values, saved: false };
    }
  });
}
export function filterRecent(values: RecentArea[], q: string) {
  const text = q.trim().toLowerCase();
  return cleanRecent(values).filter((item) =>
    `${item.searchText} ${item.source === 'google' ? '' : item.city || ''}`
      .toLowerCase()
      .includes(text),
  );
}
