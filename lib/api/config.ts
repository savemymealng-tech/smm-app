/**
 * API Configuration
 * Centralized configuration for API base URL and endpoints
 */

// Default API base URL - can be overridden via environment variables
const getApiBaseUrl = (): string => {
  // In production, you might want to use Constants.expoConfig?.extra?.apiUrl
  return process.env.EXPO_PUBLIC_API_URL || "https://app.savemymeal.com/api/v1";
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    AUTH: {
      SIGNUP_CUSTOMER: '/auth/signup/customer',
      LOGIN_CUSTOMER: '/auth/login/customer',
      REQUEST_LOGIN: '/auth/request-login',
      VERIFY: '/auth/verify',
      REFRESH: '/auth/refresh',
    },
    MEALS: {
      BROWSE: '/meals',
      ANALYTICS: '/meals/analytics',
    },
    VENDORS: {
      LIST: '/vendors',
      BY_ID: (id: string) => `/vendors/${id}`,
      BY_CITY: '/vendors/by-city',
      PRODUCTS: (id: string) => `/vendors/${id}/products`,
    },
    CUSTOMERS: {
      MEALS: '/customers/meals',
      CART: '/customers/cart',
      CART_ITEM: '/customers/cart/item',
      ORDERS: '/customers/orders',
      ORDER_BY_ID: (id: string) => `/customers/orders/${id}`,
      CANCEL_ORDER: (id: string) => `/customers/orders/${id}/cancel`,
      PROFILE: '/customers/profile',
      PROFILE_PICTURE: '/customers/profile/picture',
    },
    LOCATIONS: {
      SEARCH: '/locations/search',
    },
    CONTACT: {
      SUBMIT: '/contact',
    },
  },
} as const;

