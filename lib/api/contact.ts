/**
 * Contact API Service
 * Handles contact form submissions
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';

export interface ContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  message: string;
}

export const contactApi = {
  /**
   * Submit a contact message
   */
  async submitMessage(data: ContactMessageRequest): Promise<ContactMessageResponse> {
    const response = await apiClient.post<ApiResponse<ContactMessageResponse>>(
      API_CONFIG.ENDPOINTS.CONTACT.SUBMIT,
      data
    );
    return extractData(response);
  },
};

