/**
 * Authentication API Service
 * Handles customer authentication endpoints (per SaveMyMeal API Guide v2.0.0)
 */

import axios from 'axios';
import apiClient, { ApiResponse, extractData, tokenManager } from './client';
import { API_CONFIG } from './config';

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

export interface ResetPasswordWithCodeRequest {
  email: string;
  code: string;
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
   * Verify email with code (without auto-login)
   * POST /auth/verify-email-code
   * Verifies the 6-digit code and marks email as verified
   * Does NOT return tokens - user must login after verification
   */
  async verifyEmailCode(data: VerifyCodeRequest): Promise<{ message: string; email: string; user_type: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string; user_type: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL_CODE,
      data
    );
    return extractData(response);
  },

  /**
   * Resend verification code
   * POST /auth/resend-verification-code
   * Sends a new 6-digit code to the user's email (expires in 15 minutes)
   */
  async resendVerificationCode(email: string): Promise<{ message: string; email: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION_CODE,
      { email }
    );
    return extractData(response);
  },

  /**
   * Request password reset (customer - sends 6-digit code)
   * POST /auth/forgot-password
   * Sends 6-digit code via email (expires in 15 minutes)
   */
  async forgotPassword(email: string): Promise<{ message: string; email: string; method: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string; method: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    );
    return extractData(response);
  },

  /**
   * Verify password reset code
   * POST /auth/verify-reset-code
   * Verifies the 6-digit code before allowing password change
   */
  async verifyResetCode(email: string, code: string): Promise<{ message: string; email: string; verified: boolean }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string; verified: boolean }>>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_RESET_CODE,
      { email, code }
    );
    return extractData(response);
  },

  /**
   * Reset password with code (customer flow)
   * POST /auth/reset-password-with-code
   * Resets password using the verified code
   */
  async resetPasswordWithCode(data: ResetPasswordWithCodeRequest): Promise<{ message: string; email: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_WITH_CODE,
      data
    );
    return extractData(response);
  },

  /**
   * Resend password reset code
   * POST /auth/resend-reset-code
   * Sends a new 6-digit reset code to the user's email
   */
  async resendResetCode(email: string): Promise<{ message: string; email: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; email: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_RESET_CODE,
      { email }
    );
    return extractData(response);
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
   * POST /auth/refresh
   * Uses plain axios (bypasses apiClient interceptors) to avoid double-refresh race condition.
   * Returns both the new access token and the new refresh token (supports token rotation).
   */
  async refreshToken(currentRefreshToken: string): Promise<{ token: string; refreshToken: string }> {
    console.log('🔄 [AuthAPI] refreshToken called with token:', {
      exists: !!currentRefreshToken,
      length: currentRefreshToken?.length || 0,
      preview: currentRefreshToken ? `${currentRefreshToken.substring(0, 20)}...` : 'null'
    });
    
    if (!currentRefreshToken) {
      console.error('❌ [AuthAPI] Refresh token is null or undefined');
      await tokenManager.clearTokens();
      throw new Error('Refresh token is required');
    }

    console.log('🔄 [AuthAPI] Sending refresh request:', {
      endpoint: API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      body: { refreshToken: `${currentRefreshToken.substring(0, 20)}...` }
    });

    // Use plain axios (NOT apiClient) to bypass request interceptors and
    // prevent a double-refresh race when the access token is already expired.
    const response = await axios.post<ApiResponse<{ token: string; refreshToken?: string }>>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
      { refreshToken: currentRefreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('✅ [AuthAPI] Refresh response:', {
      status: response.status,
      success: response.data.success,
      hasData: !!response.data.data
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Token refresh failed');
    }

    const { token, refreshToken: newRefreshToken } = response.data.data;
    // Prefer the new refresh token if backend rotates them; fall back to current.
    const refreshTokenToStore = newRefreshToken || currentRefreshToken;

    await tokenManager.setTokens(token, refreshTokenToStore);
    console.log('✅ [AuthAPI] Tokens updated successfully');
    
    return { token, refreshToken: refreshTokenToStore };
  },

  /**
   * Logout - clear local tokens
   */
  async logout(): Promise<void> {
    await tokenManager.clearTokens();
  },

};

