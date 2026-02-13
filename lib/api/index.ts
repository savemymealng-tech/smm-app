/**
 * Main API Client
 * Unified export of all API services per SaveMyMeal API Guide v2.0.0
 */

import { addressesApi } from './addresses';
import { authApi } from './auth';
import { cartApi } from './cart';
import { tokenManager } from './client';
import { contactApi } from './contact';
import { featuredApi } from './featured';
import { locationsApi } from './locations';
import { mealsApi } from './meals';
import { ordersApi } from './orders';
import { paymentsApi } from './payments';
import { profileApi } from './profile';
import { reviewsApi } from './reviews';
import { vendorsApi } from './vendors';

// Re-export types
export * from '@/types/api';
export type { ApiResponse, PaginatedResponse } from './client';

/**
 * Unified API client
 * Provides access to all API services
 */
export const api = {
  auth: authApi,
  meals: mealsApi,
  vendors: vendorsApi,
  cart: cartApi,
  orders: ordersApi,
  payments: paymentsApi,
  featured: featuredApi,
  profile: profileApi,
  contact: contactApi,
  addresses: addressesApi,
  locations: locationsApi,
  reviews: reviewsApi,
  // Token management utilities
  tokenManager,
};

// Default export for backward compatibility
export default api;

