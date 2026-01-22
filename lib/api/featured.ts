/**
 * Featured Content API Service
 * Handles featured categories, products, and vendors per SaveMyMeal API Guide v2.0.0
 */

import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { 
  FeaturedCategory, 
  FeaturedProduct, 
  FeaturedVendor 
} from '@/types/api';

export const featuredApi = {
  /**
   * Get Featured Categories
   * GET /featured/categories
   */
  async getFeaturedCategories(limit: number = 10): Promise<FeaturedCategory[]> {
    const response = await apiClient.get<ApiResponse<FeaturedCategory[]>>(
      API_CONFIG.ENDPOINTS.FEATURED.CATEGORIES,
      { params: { limit } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch featured categories');
  },

  /**
   * Get Featured Products
   * GET /featured/products
   */
  async getFeaturedProducts(limit: number = 20): Promise<FeaturedProduct[]> {
    const response = await apiClient.get<ApiResponse<FeaturedProduct[]>>(
      API_CONFIG.ENDPOINTS.FEATURED.PRODUCTS,
      { params: { limit } }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch featured products');
  },

  /**
   * Get Featured Vendors
   * GET /featured/vendors
   */
  async getFeaturedVendors(limit: number = 10): Promise<FeaturedVendor[]> {
    const response = await apiClient.get<ApiResponse<FeaturedVendor[]>>(
      API_CONFIG.ENDPOINTS.FEATURED.VENDORS,
      { params: { limit } }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch featured vendors');
  },
};
