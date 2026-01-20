/**
 * Cart API Service
 * Handles shopping cart operations per SaveMyMeal API Guide v2.0.0
 */

import type {
  AddToCartRequest,
  Cart,
  RemoveFromCartRequest,
  UpdateCartRequest
} from '@/types/api';
import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';

export const cartApi = {
  /**
   * Get Current Cart
   * GET /customers/cart
   */
  async getCart(): Promise<Cart> {
    console.log('🛒 cartApi.getCart - Fetching cart from server...');
    const response = await apiClient.get<ApiResponse<any>>(
      API_CONFIG.ENDPOINTS.CART.GET
    );
    
    console.log('🛒 cartApi.getCart - Raw response:', response.data);
    
    if (response.data.success && response.data.data) {
      const rawData = response.data.data;
      
      // Handle both response formats:
      // Format 1: { items: [...], total_items: 2, subtotal: "5500.00" }
      // Format 2: [...] (array of items directly)
      
      if (Array.isArray(rawData)) {
        // Server returned array directly - transform to expected format
        console.log('🛒 cartApi.getCart - Server returned array, transforming...');
        const items = rawData.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.name,
            price: item.price,
            photo_url: item.photo_url || '',
            quantity_available: item.quantity_available || 999,
            vendor_id: item.vendor_id,
            vendor: item.vendor,
          },
        }));
        
        const subtotal = items.reduce((sum, item) => {
          return sum + (parseFloat(item.product.price) * item.quantity);
        }, 0);
        
        const cart: Cart = {
          items,
          total_items: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: subtotal.toFixed(2),
        };
        
        console.log('🛒 cartApi.getCart - Transformed cart:', {
          items: cart.items.length,
          total_items: cart.total_items,
          subtotal: cart.subtotal,
        });
        
        return cart;
      } else {
        // Server returned object with items property
        console.log('🛒 cartApi.getCart - Cart items:', rawData.items?.length || 0);
        return rawData as Cart;
      }
    }
    
    throw new Error(response.data.error || 'Failed to fetch cart');
  },

  /**
   * Add Item to Cart
   * POST /customers/cart
   */
  async addToCart(data: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CART.ADD,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to add item to cart');
  },

  /**
   * Update Cart Item Quantity
   * PUT /customers/cart
   */
  async updateCart(data: UpdateCartRequest): Promise<Cart> {
    const response = await apiClient.put<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CART.UPDATE,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to update cart');
  },

  /**
   * Remove Item from Cart
   * DELETE /customers/cart
   */
  async removeFromCart(data: RemoveFromCartRequest): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CART.REMOVE,
      { data }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to remove item from cart');
  },

  /**
   * Clear Entire Cart
   * DELETE /customers/cart/clear
   */
  async clearCart(): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(
      API_CONFIG.ENDPOINTS.CART.CLEAR
    );
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to clear cart');
    }
  },
};

