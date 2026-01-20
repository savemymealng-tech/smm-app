/**
 * Payments API Service
 * Handles payment initialization and verification per SaveMyMeal API Guide v2.0.0
 */

import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { 
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaymentVerification,
  PaymentHistory
} from '@/types/api';

export const paymentsApi = {
  /**
   * Initialize Payment
   * POST /payments/initialize
   */
  async initializePayment(data: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    const response = await apiClient.post<ApiResponse<InitializePaymentResponse>>(
      API_CONFIG.ENDPOINTS.PAYMENTS.INITIALIZE,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to initialize payment');
  },

  /**
   * Verify Payment
   * GET /payments/verify/:reference
   */
  async verifyPayment(reference: string): Promise<PaymentVerification> {
    const response = await apiClient.get<ApiResponse<PaymentVerification>>(
      API_CONFIG.ENDPOINTS.PAYMENTS.VERIFY(reference)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to verify payment');
  },

  /**
   * Get Payment History
   * GET /payments/history/:orderId
   */
  async getPaymentHistory(orderId: number): Promise<PaymentHistory[]> {
    const response = await apiClient.get<ApiResponse<PaymentHistory[]>>(
      API_CONFIG.ENDPOINTS.PAYMENTS.HISTORY(orderId)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch payment history');
  },
};
