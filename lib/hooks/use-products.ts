import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useProducts(vendorId?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['products', vendorId, categoryId],
    queryFn: async () => {
      if (vendorId) {
        // Get products from specific vendor
        const result = await api.vendors.getVendorProducts(Number(vendorId));
        console.log('Vendor products result:', result);
        return result;
      } else if (categoryId) {
        // Get products by category using the dedicated endpoint
        const result = await api.meals.getMealsByCategory(Number(categoryId));
        console.log('Category products result:', result);
        console.log('Category products data:', result.data);
        // Handle both direct array and wrapped response
        if (Array.isArray(result)) {
          return result;
        }
        return result.data || [];
      } else {
        // Browse all meals/products
        const result = await api.meals.browseMeals({
          available_only: true,
        });
        console.log('Browse meals result:', result);
        return result.data || [];
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Dedicated hook for fetching products by category
export function useCategoryProducts(categoryId: string) {
  return useQuery({
    queryKey: ['category-products', categoryId],
    queryFn: async () => {
      console.log('useCategoryProducts - Fetching for category ID:', categoryId);
      const result = await api.meals.getMealsByCategory(Number(categoryId));
      console.log('useCategoryProducts - API result:', result);
      console.log('useCategoryProducts - result.data:', result.data);
      
      // Handle PaginatedResponse structure
      if (result && typeof result === 'object') {
        // Check if it's a paginated response with data array
        if ('data' in result && Array.isArray(result.data)) {
          console.log('useCategoryProducts - Returning data array:', result.data.length, 'items');
          return result.data;
        }
        // Check if result itself is the array
        if (Array.isArray(result)) {
          console.log('useCategoryProducts - Result is array:', result.length, 'items');
          return result;
        }
      }
      
      console.log('useCategoryProducts - No valid data, returning empty array');
      return [];
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Get meal by ID - includes vendor and categories in response
      const product = await api.meals.getMealById(Number(id));
      return product;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

