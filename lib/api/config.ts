/**
 * API Configuration
 * Centralized configuration for API base URL and endpoints
 */

import { Platform } from 'react-native';

// Get localhost equivalent based on platform
const getLocalhost = (): string => {
  // Android emulator uses 10.0.2.2 to access host machine's localhost
  // iOS simulator and web can use localhost directly
  if (Platform.OS === 'android') {
    return '192.168.1.157';
  }
  return 'localhost';
};

// Default API base URL - can be overridden via environment variables
const getApiBaseUrl = (): string => {
  // Per API Guide: Production URL or localhost for development
  if (__DEV__) {
    const localhost = getLocalhost();
    const url = process.env.EXPO_PUBLIC_API_URL || `http://${localhost}:6001/api/v1`;
    console.log('🔧 API Base URL (Development):', url);
    return url;
  }
  const url = process.env.EXPO_PUBLIC_API_URL || "https://api.savemymeal.com/api/v1";
  console.log('🔧 API Base URL (Production):', url);
  return url;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    AUTH: {
      SIGNUP_CUSTOMER: '/auth/customer/signup',
      LOGIN_CUSTOMER: '/auth/customer/login',
      REQUEST_CODE: '/auth/request-code',
      VERIFY_CODE: '/auth/verify-code',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      REFRESH: '/auth/refresh-token',
    },
    
    // Meals/Products
    MEALS: {
      BROWSE: '/meals',
      BY_ID: (id: number) => `/meals/${id}`,
      BY_CATEGORY: (categoryId: number) => `/meals/category/${categoryId}`,
    },
    
    // Vendors
    VENDORS: {
      LIST: '/vendors',
      BY_ID: (id: number) => `/vendors/${id}`,
      PRODUCTS: (id: number) => `/vendors/${id}/products`,
      NEARBY: '/customers/vendors/nearby',
      SEARCH: '/customers/vendors/search',
    },
    
    // Featured Content
    FEATURED: {
      CATEGORIES: '/featured/categories',
      PRODUCTS: '/featured/products',
      VENDORS: '/featured/vendors',
    },
    
    // Cart
    CART: {
      GET: '/customers/cart',
      ADD: '/customers/cart',
      UPDATE: '/customers/cart/item',
      REMOVE: '/customers/cart/item',
      CLEAR: '/customers/cart',
    },
    
    // Orders
    ORDERS: {
      PLACE: '/customers/orders',
      LIST: '/customers/orders',
      BY_ID: (id: number) => `/customers/orders/${id}`,
      CANCEL: (id: number) => `/customers/orders/${id}/cancel`,
    },
    
    // Payments
    PAYMENTS: {
      INITIALIZE: '/payments/initialize',
      VERIFY: (reference: string) => `/payments/verify/${reference}`,
      HISTORY: (orderId: number) => `/payments/history/${orderId}`,
    },
    
    // User Profile
    PROFILE: {
      GET: '/customers/profile',
      UPDATE: '/customers/profile',
      PICTURE: '/customers/profile/picture',
    },
    
    // Addresses
    ADDRESSES: {
      LIST: '/customers/addresses',
      BY_ID: (id: number) => `/customers/addresses/${id}`,
      CREATE: '/customers/addresses',
      UPDATE: (id: number) => `/customers/addresses/${id}`,
      DELETE: (id: number) => `/customers/addresses/${id}`,
      SET_DEFAULT: (id: number) => `/customers/addresses/${id}/default`,
    },
    
    // Locations
    LOCATIONS: {
      SEARCH: '/locations/search',
    },
    
    // Contact
    CONTACT: {
      SUBMIT: '/contact',
    },
  },
};

