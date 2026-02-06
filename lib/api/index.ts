/**
 * Main API Client
 * Unified export of all API services per SaveMyMeal API Guide v2.0.0
 */

import { authApi } from './auth';
import { mealsApi } from './meals';
import { vendorsApi } from './vendors';
import { cartApi } from './cart';
import { ordersApi } from './orders';
import { paymentsApi } from './payments';
import { featuredApi } from './featured';
import { profileApi } from './profile';
import { contactApi } from './contact';
import { addressesApi } from './addresses';
import { locationsApi } from './locations';
import { tokenManager } from './client';

// Re-export types
export type { ApiResponse, PaginatedResponse } from './client';
export * from '@/types/api';

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
  // Token management utilities
  tokenManager,
};

// Default export for backward compatibility
export default api;

