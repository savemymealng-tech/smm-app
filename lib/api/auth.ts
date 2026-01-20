/**
 * Authentication API Service
 * Handles customer authentication endpoints (per SaveMyMeal API Guide v2.0.0)
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import { tokenManager } from './client';
import type { User } from '../../types';

// Request types (matching API guide)
export interface SignupRequest {
  email: string;
  password: string;
  phone: string;
  city?: string;
  state_id?: number;
  country_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RequestCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Response types (matching API guide)
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    user_type: 'customer' | 'vendor' | 'admin';
  };
}

export interface RequestCodeResponse {
  user_id: number;
}

export const authApi = {
  /**
   * Register a new customer account
   * POST /auth/customer/signup
   * Sends welcome email and verification code
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.SIGNUP_CUSTOMER,
      data
    );
    const result = extractData(response);

    // Store tokens
    if (result.token && result.refreshToken) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }

    return result;
  },

  /**
   * Authenticate existing customer
   * POST /auth/customer/login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN_CUSTOMER,
      data
    );
    const result = extractData(response);

    // Store tokens
    if (result.token && result.refreshToken) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }

    return result;
  },

  /**
   * Request verification code
   * POST /auth/request-code
   * Sends 6-digit code valid for 10 minutes
   */
  async requestCode(email: string): Promise<RequestCodeResponse> {
    const response = await apiClient.post<ApiResponse<RequestCodeResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REQUEST_CODE,
      { email }
    );
    return extractData(response);
  },

  /**
   * Verify code and get authentication tokens
   * POST /auth/verify-code
   */
  async verifyCode(data: VerifyCodeRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_CODE,
      data
    );
    const result = extractData(response);
    
    // Store tokens
    if (result.token && result.refreshToken) {
      await tokenManager.setTokens(result.token, result.refreshToken);
    }
    
    return result;
  },

  /**
   * Request password reset
   * POST /auth/forgot-password
   * Sends reset link with 40-character token valid for 1 hour
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );
    // Always returns success message (prevents email enumeration)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send reset email');
    }
  },

  /**
   * Complete password reset
   * POST /auth/reset-password
   * Updates password and invalidates token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await apiClient.post<ApiResponse>(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    if (!response.data.success) {
      throw new Error(response.data.error || 'Password reset failed');
    }
  },

  /**
   * Refresh access token
   * POST /auth/refresh-token
   * Returns new access token (refresh token remains valid)
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );
    const result = extractData(response);
    
    // Store new token (keep existing refresh token)
    if (result.token) {
      await tokenManager.setTokens(result.token, refreshToken);
    }
    
    return result.token;
  },

  /**
   * Logout - clear local tokens
   */
  async logout(): Promise<void> {
    await tokenManager.clearTokens();
  },

};

