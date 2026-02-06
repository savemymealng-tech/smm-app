import { api } from '@/lib/api';
import type { NearbyVendorsParams, SearchVendorsParams } from '@/types/api';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch all vendors
 * @param limit - Max number of results (default: 100)
 */
export function useAllVendors(limit: number = 100) {
  return useQuery({
    queryKey: ['vendors', 'all', limit],
    queryFn: async () => {
      const vendors = await api.vendors.listVendors({ limit });
      console.log('📋 All vendors:', vendors.length);
      return vendors;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch nearby vendors based on GPS coordinates
 * @param latitude - User's latitude (null to disable query)
 * @param longitude - User's longitude (null to disable query)
 * @param radius - Search radius in kilometers (default: 10)
 * @param limit - Max number of results (default: 20)
 */
export function useNearbyVendors(
  latitude: number | null, 
  longitude: number | null, 
  radius: number = 10,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['vendors', 'nearby', latitude, longitude, radius, limit],
    queryFn: async () => {
      if (latitude === null || longitude === null) {
        return [];
      }

      const params: NearbyVendorsParams = {
        latitude,
        longitude,
        radius,
        limit,
      };

      const vendors = await api.vendors.getNearbyVendors(params);
      console.log('📍 Nearby vendors:', vendors.length);
      return vendors;
    },
    enabled: latitude !== null && longitude !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to search vendors by city
 * @param city - City name to search (empty string to disable query)
 * @param latitude - Optional user latitude for distance sorting
 * @param longitude - Optional user longitude for distance sorting
 * @param limit - Max number of results (default: 50)
 */
export function useSearchVendors(
  city: string, 
  latitude?: number, 
  longitude?: number, 
  limit: number = 50
) {
  return useQuery({
    queryKey: ['vendors', 'search', city, latitude, longitude, limit],
    queryFn: async () => {
      if (!city) {
        return [];
      }

      const params: SearchVendorsParams = {
        city,
        latitude,
        longitude,
        limit,
      };

      const vendors = await api.vendors.searchVendors(params);
      console.log('🔍 Search vendors in', city, ':', vendors.length);
      return vendors;
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single vendor by ID
 * @param id - Vendor ID as string
 */
export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => api.vendors.getVendorById(Number(id)),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
