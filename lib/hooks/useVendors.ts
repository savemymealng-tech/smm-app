import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useNearbyVendors(latitude: number, longitude: number, radius?: number) {
  return useQuery({
    queryKey: ['vendors', 'nearby', latitude, longitude, radius],
    queryFn: () => api.vendors.getNearbyVendors({ latitude, longitude, radius: radius || 10 }),
    enabled: !!latitude && !!longitude,
  });
}

export function useSearchVendors(city: string, searchTerm?: string) {
  return useQuery({
    queryKey: ['vendors', 'search', city, searchTerm],
    queryFn: () => api.vendors.searchVendors({ city }),
    enabled: !!city,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => api.vendors.getVendorById(Number(id)),
    enabled: !!id,
  });
}
