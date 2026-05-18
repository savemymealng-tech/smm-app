import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function useBanners() {
  return useQuery({
    queryKey: ['banners', 'mobile'],
    queryFn: () => api.banners.getMobileBanners(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
