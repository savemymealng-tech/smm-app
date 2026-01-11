/**
 * Meals API Service
 * Handles meal browsing and discovery endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { Product } from '../../types';

export interface BrowseMealsParams {
  search?: string;
  filter?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  min_price?: number;
  max_price?: number;
  category?: string;
  categories?: string;
  dietary_preferences?: string;
  tags?: string;
  available_only?: boolean;
  vendor_id?: string;
  vendor_rating_min?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchAnalytics {
  popularSearches?: string[];
  trendingCategories?: string[];
  suggestions?: string[];
}

export const mealsApi = {
  /**
   * Browse available meals with filters
   */
  async browseMeals(params?: BrowseMealsParams): Promise<{
    meals: Product[];
    pagination?: ApiResponse['pagination'];
  }> {
    const response = await apiClient.get<ApiResponse<{
      meals: Product[];
      pagination?: ApiResponse['pagination'];
    }>>(API_CONFIG.ENDPOINTS.MEALS.BROWSE, { params });
    
    const data = extractData(response);
    return {
      meals: data.meals || [],
      pagination: data.pagination,
    };
  },

  /**
   * Get search analytics
   */
  async getSearchAnalytics(): Promise<SearchAnalytics> {
    const response = await apiClient.get<ApiResponse<SearchAnalytics>>(
      API_CONFIG.ENDPOINTS.MEALS.ANALYTICS
    );
    return extractData(response);
  },
};

