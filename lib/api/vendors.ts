/**
 * Vendors API Service
 * Handles vendor discovery and search per SaveMyMeal API Guide v2.0.0
 */

import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { Vendor, NearbyVendorsParams, SearchVendorsParams } from '@/types/api';

export const vendorsApi = {
  /**
   * Find Nearby Vendors by GPS Coordinates
   * GET /customers/vendors/nearby
   */
  async getNearbyVendors(params: NearbyVendorsParams): Promise<Vendor[]> {
    const response = await apiClient.get<ApiResponse<Vendor[]>>(
      API_CONFIG.ENDPOINTS.VENDORS.NEARBY,
      { params }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch nearby vendors');
  },

  /**
   * Search Vendors by City
   * GET /customers/vendors/search
   */
  async searchVendors(params: SearchVendorsParams): Promise<Vendor[]> {
    const response = await apiClient.get<ApiResponse<Vendor[]>>(
      API_CONFIG.ENDPOINTS.VENDORS.SEARCH,
      { params }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to search vendors');
  },

  /**
   * Get Vendor by ID
   * GET /vendors/:id
   */
  async getVendorById(id: number): Promise<Vendor> {
    const response = await apiClient.get<ApiResponse<Vendor>>(
      API_CONFIG.ENDPOINTS.VENDORS.BY_ID(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch vendor details');
  },

  /**
   * Get Products by Vendor ID
   * GET /vendors/:vendorId/products
   */
  async getVendorProducts(vendorId: number): Promise<any> {
    const response = await apiClient.get<any>(
      API_CONFIG.ENDPOINTS.VENDORS.PRODUCTS(vendorId)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch vendor products');
  },
};

