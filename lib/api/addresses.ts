/**
 * Address Management API Service
 * Handles delivery addresses per SaveMyMeal API Guide v2.0.0
 */

import type { Address } from '@/types';
import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';

export interface CreateAddressRequest {
  label: string;
  type?: 'home' | 'work' | 'other';
  street: string;
  city: string;
  stateId: number;
  zipCode: string;
  countryId: number;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  type?: 'home' | 'work' | 'other';
  street?: string;
  city?: string;
  stateId?: number;
  zipCode?: string;
  countryId?: number;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const addressesApi = {
  /**
   * Get All Addresses
   * GET /customers/addresses
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<ApiResponse<Address[]>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.LIST
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch addresses');
  },

  /**
   * Get Address by ID
   * GET /customers/addresses/:id
   */
  async getAddress(id: number): Promise<Address> {
    const response = await apiClient.get<ApiResponse<Address>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.BY_ID(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch address');
  },

  /**
   * Create New Address
   * POST /customers/addresses
   */
  async createAddress(data: CreateAddressRequest): Promise<Address> {
    const response = await apiClient.post<ApiResponse<Address>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.CREATE,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to create address');
  },

  /**
   * Update Address
   * PUT /customers/addresses/:id
   */
  async updateAddress(id: number, data: UpdateAddressRequest): Promise<Address> {
    const response = await apiClient.put<ApiResponse<Address>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.UPDATE(id),
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update address');
  },

  /**
   * Delete Address
   * DELETE /customers/addresses/:id
   */
  async deleteAddress(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.DELETE(id)
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete address');
    }
  },

  /**
   * Set Default Address
   * PUT /customers/addresses/:id/default
   */
  async setDefaultAddress(id: number): Promise<Address> {
    const response = await apiClient.post<ApiResponse<Address>>(
      API_CONFIG.ENDPOINTS.ADDRESSES.SET_DEFAULT(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to set default address');
  },
};
