import apiClient from './client';
export type GrowthConfig = {
  enabled: boolean;
  referrals_enabled: boolean;
  coins_enabled: boolean;
  coin_value_kobo: number | null;
};
export type CheckoutQuote = {
  quote_token: string;
  subtotal_kobo: number;
  delivery_kobo: number;
  service_fee_kobo: number;
  gross_kobo: number;
  discount_kobo: number;
  coins: number;
  coins_kobo: number;
  payable_kobo: number;
  campaign: { id: number; name: string; benefit: string; value: number } | null;
};
export type Rewards = GrowthConfig & {
  account: { available: number; reserved: number; debt: number };
  code: string | null;
  referral_link: string | null;
  attributed_code: string | null;
  stats: { signups: number };
  partner_codes: { code: string; partner_name: string; active: boolean }[];
  pending_checkouts: { id: string; payable_kobo: number; createdAt: string }[];
  entries: {
    id: number;
    kind: string;
    coins: number;
    available_delta: number;
    reserved_delta: number;
    note: string;
    createdAt: string;
  }[];
};
async function data<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response =
      body === undefined
        ? await apiClient.get(path)
        : await apiClient.post(path, body);
    if (!response.data.success)
      throw new Error(response.data.error || 'Unable to load offers');
    return response.data.data;
  } catch (error) {
    const cause = error as {
      response?: { data?: { error?: string } };
      error?: string;
      message?: string;
    };
    throw Object.assign(
      new Error(
        cause.response?.data?.error ||
          cause.error ||
          cause.message ||
          'Unable to load offers',
      ),
      error,
    );
  }
}
export const growthApi = {
  config: () => data<GrowthConfig>('/growth/config'),
  quote: (body: { use_cart: true; campaign_code?: string; coins?: number }) =>
    data<CheckoutQuote>('/growth/quote', body),
  rewards: () => data<Rewards>('/growth/rewards'),
  activity: (page: number) =>
    data<{
      data: Rewards['entries'];
      page: number;
      total: number;
      totalPages: number;
    }>(`/growth/coin-activity?page=${page}&limit=20`),
  release: (id: string) =>
    data(`/growth/checkouts/${encodeURIComponent(id)}/release`, {}),
};
