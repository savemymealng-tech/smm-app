/**
 * Banners API Service
 * Public endpoint - no authentication required
 */

import type { Banner } from '@/types/api';
import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';

// Derive the API host (strip /api/v1 suffix) for resolving relative image paths
const getApiHost = (): string => {
  return API_CONFIG.BASE_URL.replace(/\/api\/v\d+$/, '');
};

export const resolveImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${getApiHost()}${imageUrl}`;
};

export const bannersApi = {
  /**
   * Get mobile banners
   * GET /banners?screen=mobile
   * Returns banners targeted to 'mobile' and 'all'
   */
  async getMobileBanners(): Promise<Banner[]> {
    const response = await apiClient.get<ApiResponse<Banner[]>>(
      API_CONFIG.ENDPOINTS.BANNERS,
      { params: { screen: 'mobile' } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data.map((banner) => ({
        ...banner,
        image_url: resolveImageUrl(banner.image_url),
      }));
    }

    throw new Error(response.data.error || 'Failed to fetch banners');
  },
};
