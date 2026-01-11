import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Product } from '../../types'

export function useProducts(vendorId?: string, category?: string) {
  return useQuery({
    queryKey: ['products', vendorId, category],
    queryFn: async () => {
      if (vendorId) {
        // Get products from specific vendor
        const result = await api.vendors.getVendorProducts(vendorId, {
          category,
          available_only: true,
        });
        return result.products;
      } else {
        // Browse all meals/products
        const result = await api.meals.browseMeals({
          category,
          available_only: true,
        });
        return result.meals;
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Search for product by browsing meals with the product ID
      // Note: This assumes the server supports searching by product ID
      // If not, you may need to get it from vendor products
      const result = await api.meals.browseMeals({
        // The server might need a different param for product ID
        // For now, we'll need to find it from vendors
        limit: 1000, // Get all to find the product
      });
      const product = result.meals.find(p => p.id === id);
      if (!product) {
        throw new Error(`Product with id ${id} not found`);
      }
      return product;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

