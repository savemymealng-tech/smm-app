/**
 * Vendors API Service
 * Handles public vendor endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { Vendor, Product } from '../../types';

export interface GetVendorsParams {
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  category?: string;
  min_rating?: number;
  is_open?: boolean;
  featured?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const vendorsApi = {
  /**
   * Get all vendors with optional filters
   */
  async getVendors(params?: GetVendorsParams): Promise<{
    vendors: Vendor[];
    pagination?: ApiResponse['pagination'];
  }> {
    try {
      // Clean up params - remove undefined values
      const cleanParams = params ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ) : undefined;

      const url = API_CONFIG.ENDPOINTS.VENDORS.LIST;
      const fullUrl = `${API_CONFIG.BASE_URL}${url}`;

      console.log('Making request to:', fullUrl);
      console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      console.log('Endpoint:', url);
      console.log('Params:', cleanParams);

      const response = await apiClient.get<ApiResponse<{
        vendors: Vendor[];
        pagination?: ApiResponse['pagination'];
      }>>(url, cleanParams ? { params: cleanParams } : undefined);

      console.log('Response received:', response.status, response.statusText);
      console.log('Response data:', response.data);

      const data = extractData(response);
      return {
        vendors: data.vendors || [],
        pagination: data.pagination,
      };
    } catch (error: any) {
      console.error('Error in getVendors:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      console.error('Error config:', error?.config);
      throw error;
    }
  },

  /**
   * Get vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor> {
    const response = await apiClient.get<ApiResponse<Vendor>>(
      API_CONFIG.ENDPOINTS.VENDORS.BY_ID(id)
    );
    return extractData(response);
  },

  /**
   * Get vendors by city
   */
  async getVendorsByCity(city: string): Promise<Vendor[]> {
    const response = await apiClient.get<ApiResponse<Vendor[]>>(
      API_CONFIG.ENDPOINTS.VENDORS.BY_CITY,
      { params: { city } }
    );
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get products by vendor ID
   */
  async getVendorProducts(vendorId: string, params?: {
    category?: string;
    available_only?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    products: Product[];
    pagination?: ApiResponse['pagination'];
  }> {
    const response = await apiClient.get<ApiResponse<{
      products: Product[];
      pagination?: ApiResponse['pagination'];
    }>>(API_CONFIG.ENDPOINTS.VENDORS.PRODUCTS(vendorId), { params });

    const data = extractData(response);
    return {
      products: data.products || [],
      pagination: data.pagination,
    };
  },
};
