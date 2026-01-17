/**
 * Profile API Service
 * Handles customer profile management endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { User } from '../../types';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export const profileApi = {
  /**
   * Get customer profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.PROFILE
    );
    return extractData(response);
  },

  /**
   * Update customer profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.PROFILE,
      data
    );
    return extractData(response);
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(uri: string, type: string = 'image/jpeg'): Promise<User> {
    // Create FormData for file upload
    const formData = new FormData();
    
    // For React Native, we need to handle the file differently
    // @ts-ignore - FormData in React Native accepts objects with specific structure
    formData.append('profile_picture', {
      uri,
      type,
      name: 'profile.jpg',
    } as any);

    const response = await apiClient.post<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.PROFILE_PICTURE,
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

