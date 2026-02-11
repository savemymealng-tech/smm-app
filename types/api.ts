/**
 * API Response Types
 * Complete type definitions for SaveMyMeal API v2.0.0
 */

// ============================================
// COMMON TYPES
// ============================================

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: number;
  name: string;
  description: string;
  is_featured?: boolean;
  display_order?: number;
  createdAt: string;
}

// ============================================
// VENDOR TYPES
// ============================================

export interface VendorUser {
  id: number;
  username: string;
  email: string;
}

export interface Vendor {
  id: number;
  business_name: string;
  address: string;
  city: string;
  phone: string;
  logo: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  latitude: string;
  longitude: string;
  rating: string;
  total_orders: number;
  distance?: string;
  user?: VendorUser;
}

// ============================================
// MEAL/PRODUCT TYPES
// ============================================

export interface Meal {
  id: number;
  vendor_id: number;
  name: string;
  description: string;
  price: string;
  original_price?: string;
  quantity_available: number;
  expiry_date: string;
  photo_url: string;
  weight?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  is_available: boolean;
  is_featured: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  vendor: Vendor;
  distance?: string;
  delivery_fee?: string;
  available_for_pickup?: boolean;
  available_for_delivery?: boolean;
  pickup_time_minutes?: number;
  delivery_time_minutes?: number;
}

export interface BrowseMealsParams {
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  min_price?: number;
  max_price?: number;
  category?: string;
  categories?: string;
  dietary_preferences?: string;
  tags?: string;
  available_only?: boolean;
  expiring_soon?: boolean;
  vendor_id?: number;
  vendor_rating_min?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'expiry_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_expired?: boolean;
  include_out_of_stock?: boolean;
}

// ============================================
// VENDOR SEARCH TYPES
// ============================================

export interface NearbyVendorsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

export interface SearchVendorsParams {
  city: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

// ============================================
// CART TYPES
// ============================================

export interface CartProduct {
  id: number;
  name: string;
  price: string;
  photo_url: string;
  quantity_available: number;
  vendor_id?: number;
  vendor?: {
    id: number;
    business_name: string;
  };
}

export interface CartItem {
  id?: number;
  product_id: number;
  quantity: number;
  product: CartProduct;
  fulfillment_method?: 'pickup' | 'delivery' | null;
  requires_fulfillment_choice?: boolean;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: string;
  delivery_fee?: string;
  service_fee?: string;
  tax?: string;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
  fulfillment_method?: 'pickup' | 'delivery';
}

export interface UpdateCartRequest {
  product_id: number;
  quantity: number;
  fulfillment_method?: 'pickup' | 'delivery';
}

export interface RemoveFromCartRequest {
  product_id: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface DeliveryAddress {
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: {
    id: number;
    name: string;
  };
  country: {
    id: number;
    name: string;
  };
  postal_code?: string;
  additional_info?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string;
  weight?: string;
  subtotal?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    vendor_id: number;
    name: string;
    description: string;
    price: string;
    original_price?: string;
    quantity_available: number;
    expiry_date: string;
    photo_url: string;
    weight?: string;
    meta_title?: string;
    meta_description?: string;
    tags?: string;
    is_available: boolean;
    is_featured: boolean;
    featured_request_status?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Order {
  id: number;
  customer_id: number;
  vendor_id: number;
  order_group_id?: string;
  total_amount: string;
  delivery_fee: string;
  service_fee: string;
  delivery_address: DeliveryAddress | string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled' | 'rejected';
  payment_method: 'card' | 'cash_on_delivery' | 'wallet' | 'cash' | 'transfer';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment?: {
    id: number;
    reference: string;
    authorization_url: string;
    status: string;
    order_id?: number;
    order_group_id?: string;
  } | null;
  special_instructions?: string;
  rejection_reason?: string;
  estimated_delivery_time?: string;
  createdAt: string;
  updatedAt: string;
  Customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    state_id?: number;
    country_id?: number;
    state?: {
      id: number;
      name: string;
    } | null;
    country?: {
      id: number;
      name: string;
    } | null;
  };
  vendor?: {
    id: number;
    business_name: string;
    logo?: string;
    phone?: string;
    address?: string;
    city?: string;
    state_id?: number;
    country_id?: number;
    rating?: string;
    state?: {
      id: number;
      name: string;
    };
    country?: {
      id: number;
      name: string;
    };
  };
  orderItems?: OrderItem[];
  items?: OrderItem[];
}

export interface PlaceOrderRequest {
  /** When true, server uses current user cart; items can be omitted. Preferred when logged in. */
  use_cart?: boolean;
  /** Order line items. Omit or leave empty when use_cart is true. */
  items?: {
    product_id: number;
    quantity: number;
  }[];
  /** Use a saved address by ID (preferred when user has addresses) */
  address_id?: number;
  /** Full delivery address (when not using address_id) */
  delivery_address?: DeliveryAddress;
  /** "Deliver to" name when using address_id */
  recipient_name?: string;
  special_instructions?: string;
  payment_method?: 'card' | 'cash_on_delivery' | 'wallet';
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface InitializePaymentRequest {
  orderId?: number;
  orderGroupId?: string;
  email: string;
  callbackUrl?: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaymentVerification {
  reference: string;
  amount: string;
  status: 'success' | 'failed' | 'abandoned' | 'refunded';
  paid_at: string;
  channel: 'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money';
  order: {
    id: number;
    payment_status: string;
    status: string;
  };
}

export interface PaymentHistory {
  id: number;
  order_id: number;
  reference: string;
  amount: string;
  status: string;
  payment_channel: string;
  paid_at: string;
  createdAt: string;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface SubmitReviewRequest {
  order_id: number;
  rating: number; // 1-5 star rating
  review?: string; // Optional text review
  food_quality_rating?: number; // 1-5
  delivery_rating?: number; // 1-5
  packaging_rating?: number; // 1-5
}

export interface Review {
  id: number;
  order_id: number;
  customer_id: number;
  vendor_id: number;
  rating: number;
  review?: string;
  food_quality_rating?: number;
  delivery_rating?: number;
  packaging_rating?: number;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

// ============================================
// FEATURED CONTENT TYPES
// ============================================

export interface FeaturedCategory extends Category {
  is_featured: true;
  display_order: number;
}

export interface FeaturedProduct extends Meal {
  is_featured: true;
}

export interface FeaturedVendor extends Vendor {
  is_featured: true;
}
