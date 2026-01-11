/**
 * Main API Client
 * Unified export of all API services
 */

import { authApi } from './auth';
import { mealsApi } from './meals';
import { vendorsApi } from './vendors';
import { cartApi } from './cart';
import { ordersApi } from './orders';
import { profileApi } from './profile';
import { locationsApi } from './locations';
import { contactApi } from './contact';
import { tokenManager } from './client';

// Re-export types
export type { ApiResponse } from './client';
export type { SignupRequest, LoginRequest, RequestLoginRequest, VerifyRequest, AuthResponse } from './auth';
export type { BrowseMealsParams, SearchAnalytics } from './meals';
export type { GetVendorsParams } from './vendors';
export type { AddToCartRequest, UpdateCartItemRequest, RemoveCartItemRequest } from './cart';
export type { PlaceOrderRequest, OrderHistoryParams } from './orders';
export type { UpdateProfileRequest } from './profile';
export type { SearchLocationsParams, Location } from './locations';
export type { ContactMessageRequest, ContactMessageResponse } from './contact';

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
  profile: profileApi,
  locations: locationsApi,
  contact: contactApi,
  // Token management utilities
  tokenManager,
};

// Default export for backward compatibility
export default api;

