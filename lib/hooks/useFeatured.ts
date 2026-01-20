import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFeaturedCategories() {
  return useQuery({
    queryKey: ['featured', 'categories'],
    queryFn: () => api.featured.getFeaturedCategories(),
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured', 'products'],
    queryFn: () => api.featured.getFeaturedProducts(),
  });
}

export function useFeaturedVendors() {
  return useQuery({
    queryKey: ['featured', 'vendors'],
    queryFn: () => api.featured.getFeaturedVendors(),
  });
}
