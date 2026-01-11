/**
 * Locations API Service
 * Handles location search endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';

export interface Location {
  id: string;
  name: string;
  type: 'city' | 'state' | 'country';
  country?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface SearchLocationsParams {
  q: string;
  type?: 'city' | 'state' | 'country';
  limit?: number;
}

export const locationsApi = {
  /**
   * Search for locations (cities, states, countries)
   */
  async searchLocations(params: SearchLocationsParams): Promise<Location[]> {
    const response = await apiClient.get<ApiResponse<Location[]>>(
      API_CONFIG.ENDPOINTS.LOCATIONS.SEARCH,
      { params }
    );
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },
};

