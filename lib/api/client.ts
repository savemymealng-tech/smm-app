/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { isTokenExpired, isTokenExpiringSoon } from '../utils/jwt';
import { API_CONFIG } from './config';

// Token storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// Server response format (matching API guide)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Paginated response format
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Token management functions
export const tokenManager = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Error setting tokens:', error);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request queue for handling concurrent 401 errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper function to refresh the access token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await tokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post<ApiResponse<{ token: string; refreshToken?: string }>>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken }
  );

  if (response.data.success && response.data.data) {
    const { token, refreshToken: newRefreshToken } = response.data.data;
    // Store new tokens
    await tokenManager.setTokens(token, newRefreshToken || refreshToken);
    return token;
  }

  throw new Error('Token refresh failed');
};

// Request interceptor - add auth token and handle proactive refresh
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenManager.getAccessToken();
    
    if (token) {
      // SCENARIO A: Token is expired
      if (isTokenExpired(token)) {
        console.log('⚠️ Token expired, refreshing before request...');
        try {
          const newToken = await refreshAccessToken();
          if (config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          await tokenManager.clearTokens();
          throw error;
        }
      }
      // SCENARIO B: Token expiring soon (< 10 minutes)
      else if (isTokenExpiringSoon(token, 10)) {
        console.log('⏰ Token expiring soon, refreshing in background...');
        // Non-blocking refresh - don't await
        refreshAccessToken().catch((error) => {
          console.error('❌ Background token refresh failed:', error);
        });
        // Continue with current token
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      // SCENARIO C: Token is fresh
      else {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    
    // Log all requests in development
    console.log('🌐 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh with request queue
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized with request queue
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Another request is already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        // Process all queued requests
        processQueue(null, newToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and reject all queued requests
        processQueue(refreshError, null);
        await tokenManager.clearTokens();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Transform error response to match ApiResponse format
    // Extract the most user-friendly error message available (per API guide)
    let errorMessage = 'An error occurred';
    
    if (error.response?.data) {
      const data: any = error.response.data;
      
      // Handle validation errors first
      if (data.validationErrors && Array.isArray(data.validationErrors) && data.validationErrors.length > 0) {
        errorMessage = data.validationErrors.map((err: any) => err.message).join(', ');
      }
      // Then check for general error message
      else if (data.error) {
        errorMessage = data.error;
      }
      // Fallback to message
      else if (data.message) {
        errorMessage = data.message;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please check your internet connection.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Handle specific HTTP status codes
    if (error.response?.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    const apiError: ApiResponse = {
      success: false,
      error: errorMessage,
      validationErrors: error.response?.data?.validationErrors,
    };

    return Promise.reject(apiError);
  }
);

// Helper function to extract data from ApiResponse
export function extractData<T>(response: { data: ApiResponse<T> }): T {
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  throw new Error(response.data.error || 'Invalid response format');
}

export default apiClient;

