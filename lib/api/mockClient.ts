import type {
  Category,
  Filter,
  Order,
  Product,
  SearchResult,
  User,
  Vendor,
  VendorParams,
} from "../../types";
import { delay } from "../utils";
import { mockCategories } from "./categories";
import { mockProducts } from "./products";
import { mockVendors } from "./vendors";

const API_DELAY_MS = 300;

type MockResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

class MockApiClient {
  async request<T>(data: T, delayMs = API_DELAY_MS): Promise<MockResponse<T>> {
    await delay(delayMs);
    return {
      data,
      success: true,
    };
  }

  async getVendors(filters?: VendorParams): Promise<MockResponse<Vendor[]>> {
    let vendors = [...mockVendors];

    if (filters?.categories && filters.categories.length > 0) {
      const productsFiltered = mockProducts.filter((p) =>
        filters.categories!.includes(p.category)
      );
      const vendorIds = new Set(productsFiltered.map((p) => p.vendorId));
      vendors = vendors.filter((v) => vendorIds.has(v.id));
    }

    if (filters?.minRating) {
      vendors = vendors.filter((v) => v.rating >= filters.minRating!);
    }

    if (filters?.maxDeliveryTime) {
      vendors = vendors.filter(
        (v) => v.deliveryTime <= filters.maxDeliveryTime!
      );
    }

    if (filters?.cuisine && filters.cuisine.length > 0) {
      vendors = vendors.filter((v) =>
        v.cuisine.some((c) => filters.cuisine!.includes(c))
      );
    }

    if (filters?.isOpen !== undefined) {
      vendors = vendors.filter((v) => v.isOpen === filters.isOpen);
    }

    if (filters?.featured !== undefined) {
      vendors = vendors.filter((v) => v.featured === filters.featured);
    }

    if (filters?.sort) {
      switch (filters.sort) {
        case "rating":
          vendors.sort((a, b) => b.rating - a.rating);
          break;
        case "deliveryTime":
          vendors.sort((a, b) => a.deliveryTime - b.deliveryTime);
          break;
        case "distance":
          vendors.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          break;
        default:
          break;
      }
    }

    if (filters?.limit) {
      vendors = vendors.slice(0, filters.limit);
    }

    return this.request(vendors);
  }

  async getVendorById(id: string): Promise<MockResponse<Vendor>> {
    const vendor = mockVendors.find((v) => v.id === id);
    if (!vendor) {
      throw new Error(`Vendor with id ${id} not found`);
    }
    return this.request(vendor);
  }

  async getProducts(
    vendorId?: string,
    category?: string
  ): Promise<MockResponse<Product[]>> {
    let products = [...mockProducts];

    if (vendorId) {
      products = products.filter((p) => p.vendorId === vendorId);
    }

    if (category) {
      products = products.filter((p) => p.category === category);
    }

    return this.request(products);
  }

  async getProductById(id: string): Promise<MockResponse<Product>> {
    const product = mockProducts.find((p) => p.id === id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return this.request(product);
  }

  async getCategories(): Promise<MockResponse<Category[]>> {
    return this.request(mockCategories);
  }

  async getCategoryById(id: string): Promise<MockResponse<Category>> {
    const category = mockCategories.find((c) => c.id === id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return this.request(category);
  }

  async search(
    query: string,
    filters?: Filter
  ): Promise<MockResponse<SearchResult>> {
    const lowerQuery = query.toLowerCase();

    let vendors = mockVendors.filter(
      (v) =>
        v.name.toLowerCase().includes(lowerQuery) ||
        v.description.toLowerCase().includes(lowerQuery) ||
        v.cuisine.some((c) => c.toLowerCase().includes(lowerQuery))
    );

    let products = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );

    if (filters?.minRating) {
      vendors = vendors.filter((v) => v.rating >= filters.minRating!);
    }

    if (filters?.priceRange) {
      const [min, max] = filters.priceRange;
      products = products.filter((p) => p.price >= min && p.price <= max);
    }

    if (filters?.categories && filters.categories.length > 0) {
      products = products.filter((p) =>
        filters.categories!.includes(p.category)
      );
      const vendorIds = new Set(products.map((p) => p.vendorId));
      vendors = vendors.filter((v) => vendorIds.has(v.id));
    }

    const result: SearchResult = {
      vendors,
      products,
      total: vendors.length + products.length,
    };

    return this.request(result);
  }

  async getOrders(userId: string): Promise<MockResponse<Order[]>> {
    return this.request([]);
  }

  async getOrderById(id: string): Promise<MockResponse<Order>> {
    throw new Error("Order not found");
  }

  async createOrder(order: Partial<Order>): Promise<MockResponse<Order>> {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      userId: order.userId || "user-1",
      vendorId: order.vendorId || "",
      vendor: order.vendor!,
      items: order.items || [],
      status: "pending",
      address: order.address!,
      paymentMethod: order.paymentMethod!,
      subtotal: order.subtotal || 0,
      deliveryFee: order.deliveryFee || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.request(newOrder);
  }

  async login(email: string, password: string): Promise<MockResponse<User>> {
    const user: User = {
      id: "user-1",
      email,
      name: "John Doe",
      phone: "+1234567890",
      addresses: [],
      paymentMethods: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.request(user);
  }

  async register(data: Partial<User>): Promise<MockResponse<User>> {
    const user: User = {
      id: `user-${Date.now()}`,
      email: data.email || "",
      name: data.name || "",
      phone: data.phone,
      addresses: [],
      paymentMethods: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.request(user);
  }

  async updateUser(
    userId: string,
    data: Partial<User>
  ): Promise<MockResponse<User>> {
    const user: User = {
      id: userId,
      email: data.email || "",
      name: data.name || "",
      phone: data.phone,
      avatar: data.avatar,
      addresses: data.addresses || [],
      paymentMethods: data.paymentMethods || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.request(user);
  }
}

export const api = new MockApiClient();
