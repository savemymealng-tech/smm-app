/**
 * Authentication API Service
 * Handles customer authentication endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import { tokenManager } from './client';
import type { User } from '../../types';

export interface SignupRequest {
  email: string;
  password: string;
  phone?: string;
  city?: string;
  state_id?: number;
  country_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RequestLoginRequest {
  email: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  user?: User;
  token: string;
  refreshToken?: string;
  user_id?: string;
  email?: string;
  user_type?: string;
}

export const authApi = {
  /**
   * Register a new customer with password
   * Returns tokens for immediate login
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.SIGNUP_CUSTOMER,
      data
    );
    const result = extractData(response);

    // Store tokens
    if (result.token) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }

    return result;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN_CUSTOMER,
      data
    );
    const result = extractData(response);

    // Store tokens
    if (result.token) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }

    return result;
  },

  /**
   * Request verification code for login
   */
  async requestLogin(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.REQUEST_LOGIN,
      { email }
    );
    return extractData(response);
  },

  /**
   * Verify code and get authentication tokens
   */
  async verify(email: string, code: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY,
      { email, code }
    );
    const result = extractData(response);
    
    // Store tokens (server returns 'token' not 'accessToken')
    // Server response: { token, refreshToken, user: { id, email, user_type } }
    if (result.token) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }
    
    // Map server user format to app User type if needed
    if (result.user_id && !result.user) {
      result.user = {
        id: result.user_id.toString(),
        email: result.email || email,
        name: '', // Will be fetched from profile
        phone: '',
        addresses: [],
        paymentMethods: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    }
    
    return result;
  },

  /**
   * Refresh access token
   */
  async refresh(): Promise<AuthResponse> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    const result = extractData(response);
    
    // Update tokens (server returns 'token' not 'accessToken', and may not return new refreshToken)
    if (result.token) {
      // Keep existing refresh token if new one not provided
      const existingRefreshToken = await tokenManager.getRefreshToken();
      await tokenManager.setTokens(result.token, result.refreshToken || existingRefreshToken || undefined);
    }
    
    return result;
  },

  /**
   * Logout - clear tokens
   */
  async logout(): Promise<void> {
    await tokenManager.clearTokens();
  },
};

