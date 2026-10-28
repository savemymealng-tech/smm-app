import { API_CONFIG } from './api/config';

/** File origin is independent of /api/v1 and may be overridden by a CDN. */
export function getBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_FILE_BASE_URL;
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (['http:', 'https:'].includes(parsed.protocol))
        return parsed.href.replace(/\/+$/, '');
    } catch {
      /* Fall back to the configured API origin. */
    }
  }
  return new URL(API_CONFIG.BASE_URL).origin;
}
export function getFullUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string' || !path.trim()) return null;
  const value = path.trim();
  if (/^(file:|content:|data:image\/|blob:)/i.test(value)) return value;
  try {
    if (/^https?:\/\//i.test(value) || value.startsWith('//')) {
      const parsed = new URL(value, getBaseUrl());
      if (
        ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'].includes(
          parsed.hostname.toLowerCase(),
        )
      ) {
        return getBaseUrl() + parsed.pathname + parsed.search + parsed.hash;
      }
      return parsed.href;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
    return new URL(value.replace(/^\/+/, ''), getBaseUrl() + '/').href;
  } catch {
    return null;
  }
}
export const getFileUrl = getFullUrl;
export function transformUrlFields<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fields: (keyof T)[],
): T | null {
  if (!obj) return null;
  const transformed = { ...obj };
  for (const field of fields)
    if (typeof obj[field] === 'string')
      Object.assign(transformed, { [field]: getFullUrl(obj[field] as string) });
  return transformed;
}
export function getImageSource(
  uri: string | null | undefined,
  fallback?: string,
): { uri: string } | undefined {
  const value = getFullUrl(uri) || getFullUrl(fallback);
  return value ? { uri: value } : undefined;
}
