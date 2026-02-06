/**
 * Locations API Service
 * Handles location search endpoints
 */

import apiClient, { ApiResponse, extractData } from './client';
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

export interface Country {
  id: number;
  name: string;
  code?: string;
}

export interface State {
  id: number;
  name: string;
  countryId: number;
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

  /**
   * Get all countries
   * GET /locations/countries
   */
  async getCountries(): Promise<Country[]> {
    const response = await apiClient.get<ApiResponse<Country[]>>(
      API_CONFIG.ENDPOINTS.LOCATIONS.COUNTRIES
    );
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get states by country ID
   * GET /locations/countries/:id/states
   */
  async getStatesByCountry(countryId: number): Promise<State[]> {
    const response = await apiClient.get<ApiResponse<State[]>>(
      API_CONFIG.ENDPOINTS.LOCATIONS.STATES_BY_COUNTRY(countryId)
    );
    const data = extractData(response);
    return Array.isArray(data) ? data : [];
  },
};

