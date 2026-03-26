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
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      console.log('🔑 [TokenManager] getAccessToken:', {
        exists: !!token,
        length: token?.length || 0
      });
      return token;
    } catch (error) {
      console.error('❌ [TokenManager] Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      console.log('🔑 [TokenManager] getRefreshToken:', {
        exists: !!token,
        length: token?.length || 0,
        preview: token ? `${token.substring(0, 20)}...` : 'null'
      });
      return token;
    } catch (error) {
      console.error('❌ [TokenManager] Error getting refresh token:', error);
      return null;
    }
  },

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      console.log('🔑 [TokenManager] setTokens called:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        console.log('✅ [TokenManager] Both tokens stored successfully');
      } else {
        console.log('✅ [TokenManager] Access token stored (no refresh token provided)');
      }
    } catch (error) {
      console.error('❌ [TokenManager] Error setting tokens:', error);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      console.log('🗑️ [TokenManager] Clearing all tokens');
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      console.log('✅ [TokenManager] Tokens cleared successfully');
    } catch (error) {
      console.error('❌ [TokenManager] Error clearing tokens:', error);
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
  
  console.log('🔄 [RefreshToken] Retrieved refresh token:', {
    exists: !!refreshToken,
    length: refreshToken?.length || 0,
    preview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null'
  });
  
  if (!refreshToken) {
    // No refresh token means user is not logged in — don't clear anything, just bail.
    throw new Error('No refresh token available');
  }

  console.log('🔄 [RefreshToken] Sending refresh request to:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`);
  console.log('🔄 [RefreshToken] Request body:', { refreshToken: `${refreshToken.substring(0, 20)}...` });

  const response = await axios.post<ApiResponse<{ token: string; refreshToken?: string }>>(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('✅ [RefreshToken] Response received:', {
    status: response.status,
    success: response.data.success,
    hasToken: !!response.data.data?.token
  });

  if (response.data.success && response.data.data) {
    const { token, refreshToken: newRefreshToken } = response.data.data;
    // Store new tokens
    await tokenManager.setTokens(token, newRefreshToken || refreshToken);
    console.log('✅ [RefreshToken] New tokens stored successfully');
    return token;
  }

  console.error('❌ [RefreshToken] Invalid response format');
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
        } catch (error: any) {
          console.error('❌ Token refresh failed:', error);
          // Only wipe tokens when the server explicitly rejected them (401).
          // Don't clear on network errors — the user may just be offline.
          if (error?.response?.status === 401) {
            await tokenManager.clearTokens();
          }
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

    // Check if this is an authentication endpoint that shouldn't trigger token refresh
    const authEndpointsToSkip = [
      '/auth/customer/login',
      '/auth/customer/signup',
      '/auth/vendor/login',
      '/auth/vendor/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email-code',
      '/auth/resend-verification-code',
    ];
    
    const isAuthEndpoint = authEndpointsToSkip.some(endpoint => 
      originalRequest?.url?.includes(endpoint)
    );

    // Handle 401 Unauthorized with request queue
    // Skip token refresh for authentication endpoints (login, signup, etc.)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
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
      } catch (refreshError: any) {
        // Refresh failed - reject all queued requests
        processQueue(refreshError, null);
        // Only clear tokens when the refresh endpoint itself returned 401
        // (revoked / expired). A network error should not log the user out.
        if (refreshError?.response?.status === 401) {
          await tokenManager.clearTokens();
        }
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
    
    const apiError: ApiResponse & { statusCode?: number; responseData?: any } = {
      success: false,
      error: errorMessage,
      validationErrors: error.response?.data?.validationErrors,
      statusCode: error.response?.status,
      responseData: error.response?.data,
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

