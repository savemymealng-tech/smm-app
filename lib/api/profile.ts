/**
 * Profile API Service
 * Handles customer profile management endpoints
 */

import type { User } from '../../types';
import apiClient, { ApiResponse, extractData } from './client';
import { API_CONFIG } from './config';

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  city?: string;
  state_id?: number;
  country_id?: number;
}

export const profileApi = {
  /**
   * Get customer profile
   * GET /customers/profile
   */
  async getProfile(): Promise<User> {
    console.log('📋 profileApi.getProfile - Fetching profile...');
    const response = await apiClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.PROFILE.GET
    );
    console.log('📋 profileApi.getProfile - Response:', response.data);
    return extractData(response);
  },

  /**
   * Update customer profile
   * PUT /customers/profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    console.log('📋 profileApi.updateProfile - Updating with:', data);
    const response = await apiClient.put<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.PROFILE.UPDATE,
      data
    );
    console.log('📋 profileApi.updateProfile - Response:', response.data);
    return extractData(response);
  },

  /**
   * Upload profile picture
   * POST /customers/profile/picture
   */
  async uploadProfilePicture(uri: string, type: string = 'image/jpeg'): Promise<{ url: string }> {
    console.log('📋 profileApi.uploadProfilePicture - Uploading...');
    // Create FormData for file upload
    const formData = new FormData();
    
    // For React Native, we need to handle the file differently
    // @ts-ignore - FormData in React Native accepts objects with specific structure
    formData.append('profile_picture', {
      uri,
      type,
      name: 'profile.jpg',
    } as any);

    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      API_CONFIG.ENDPOINTS.PROFILE.PICTURE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return extractData(response);
  },
};

