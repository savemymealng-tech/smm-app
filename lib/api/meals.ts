/**
 * Meals API Service
 * Handles meal/product browsing and details per SaveMyMeal API Guide v2.0.0
 */

import type { BrowseMealsParams, Meal } from '@/types/api';
import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { API_CONFIG } from './config';

export const mealsApi = {
  /**
   * Browse Meals with Advanced Filtering
   * GET /meals
   */
  async browseMeals(params: BrowseMealsParams = {}): Promise<PaginatedResponse<Meal>> {
    const response = await apiClient.get<PaginatedResponse<Meal>>(
      API_CONFIG.ENDPOINTS.MEALS.BROWSE,
      { params }
    );
    return response.data;
  },

  /**
   * Get Meal Details by ID
   * GET /meals/:id
   */
  async getMealById(id: number): Promise<Meal> {
    const response = await apiClient.get<ApiResponse<Meal>>(
      API_CONFIG.ENDPOINTS.MEALS.BY_ID(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch meal details');
  },

  /**
   * Get Products by Category
   * GET /meals/category/:categoryId
   */
  async getMealsByCategory(
    categoryId: number,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Meal>> {
    const endpoint = API_CONFIG.ENDPOINTS.MEALS.BY_CATEGORY(categoryId);
    console.log('Fetching category products from:', endpoint);
    console.log('Category ID:', categoryId);
    console.log('Params:', params);
    
    const response = await apiClient.get<PaginatedResponse<Meal>>(
      endpoint,
      { params }
    );
    
    console.log('Category API raw response:', response.data);
    return response.data;
  },
};