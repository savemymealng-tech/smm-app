import {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

type Cooldown = { until: number; scope: string; path: string; method: string };
const cooldowns = new Map<string, Cooldown>();
export function retryAfterSeconds(
  value: unknown,
  fallback: unknown = 60,
  now = Date.now(),
): number {
  const text = String(value ?? '').trim();
  const numeric = text && /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
  const date = text && !Number.isFinite(numeric) ? Date.parse(text) : NaN;
  const seconds = Number.isFinite(numeric)
    ? numeric
    : Number.isFinite(date)
      ? (date - now) / 1000
      : Number(fallback);
  return Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds)) : 60;
}
export function isRateLimited(error: unknown): boolean {
  const e = error as {
    statusCode?: number;
    response?: { status?: number };
  } | null;
  return e?.statusCode === 429 || e?.response?.status === 429;
}
function pathFor(config: InternalAxiosRequestConfig): string {
  try {
    return new URL(
      config.url || '',
      config.baseURL?.replace(/\/?$/, '/') || 'http://local/',
    ).pathname
      .replace(/^\/api\/v1/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  } catch {
    return (config.url || '')
      .split('?')[0]
      .replace(/^\/api\/v1/, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }
}
function applies(item: Cooldown, config: InternalAxiosRequestConfig): boolean {
  const path = pathFor(config);
  if (item.scope === 'general') return true;
  const authPath = path.replace(/^\/auth/, '');
  const routes: Record<string, string[]> = {
    login: [
      '/login/customer',
      '/customer/login',
      '/login/vendor',
      '/vendor/login',
      '/admin/login',
    ],
    signup: [
      '/signup/customer',
      '/customer/signup',
      '/signup/vendor',
      '/vendor/signup',
      '/admin/register',
    ],
    codeSend: [
      '/request-login',
      '/forgot-password',
      '/resend-reset-code',
      '/resend-verification',
      '/resend-verification-code',
      '/account-deletion/request-code',
    ],
    codeVerify: [
      '/verify',
      '/verify-reset-code',
      '/verify-email-code',
      '/verify-email',
      '/account-deletion/verify-code',
      '/account-deletion/confirm',
    ],
    passwordReset: ['/reset-password', '/reset-password-with-code'],
    refresh: ['/refresh', '/refresh-token'],
  };
  if (routes[item.scope]) return routes[item.scope].includes(authPath);
  if (item.scope === 'location')
    return /^\/locations\/(search|browsing)(\/|$)/.test(path);
  if (item.scope === 'contact')
    return path === '/contact' && config.method?.toLowerCase() === 'post';
  if (item.scope === 'upload')
    return (
      ['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '') &&
      (/\/(profile\/picture|logo|kyc|kyc-documents)$/.test(path) ||
        /\/(meals|banners)(\/[^/]+)?$/.test(path))
    );
  return path === item.path && (config.method || 'get') === item.method;
}
export function rateLimitWaitMs(path: string): number {
  const config = { url: path, method: 'get' } as InternalAxiosRequestConfig;
  return Math.max(
    0,
    ...Array.from(cooldowns.values())
      .filter((item) => applies(item, config))
      .map((item) => item.until - Date.now()),
  );
}
/** Suppress requests during Retry-After. Never queue or automatically replay mutations. */
export function attachRateLimitHandling(
  client: AxiosInstance,
  enabled: () => boolean = () => true,
) {
  client.interceptors.request.use((config) => {
    if (!enabled()) return config;
    const now = Date.now();
    for (const [key, item] of cooldowns) {
      if (item.until <= now) {
        cooldowns.delete(key);
        continue;
      }
      if (key.startsWith(`${config.baseURL || ''}|`) && applies(item, config)) {
        const seconds = Math.max(1, Math.ceil((item.until - now) / 1000));
        throw new AxiosError(
          `Please wait ${seconds} seconds before trying again.`,
          'ERR_RATE_LIMITED',
          config,
          undefined,
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'retry-after': String(seconds) },
            config,
            data: {
              success: false,
              error: `Please wait ${seconds} seconds before trying again.`,
              code: 'RATE_LIMITED',
              rateLimit: { scope: item.scope, retryAfterSeconds: seconds },
            },
          },
        );
      }
    }
    return config;
  });
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const config = error.config as InternalAxiosRequestConfig | undefined;
      if (
        enabled() &&
        error.code !== 'ERR_RATE_LIMITED' &&
        error.response?.status === 429 &&
        config
      ) {
        const data = error.response.data;
        const seconds = retryAfterSeconds(
          error.response.headers?.['retry-after'],
          data?.rateLimit?.retryAfterSeconds,
        );
        const scope = data?.rateLimit?.scope || 'general';
        const key = `${config.baseURL || ''}|${scope}`;
        const until = Math.max(
          cooldowns.get(key)?.until || 0,
          Date.now() + seconds * 1000,
        );
        cooldowns.set(key, {
          until,
          scope,
          path: pathFor(config),
          method: config.method || 'get',
        });
        error.message =
          data?.error || `Please wait ${seconds} seconds before trying again.`;
      }
      return Promise.reject(error);
    },
  );
}
