import { useAtomValue } from "jotai";
import { locationAtom } from "@/lib/atoms/location";
import { api } from "@/lib/api";
import type { BrowseMealsParams } from "@/types/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export function useBrowseMeals(params?: BrowseMealsParams) {
  return useQuery({
    queryKey: ["meals", "browse", params],
    queryFn: () => api.meals.browseMeals(params),
    enabled: true,
  });
}

export function useBrowseMealsInfinite(
  params?: Omit<BrowseMealsParams, "page">,
) {
  return useInfiniteQuery({
    queryKey: ["meals", "browse-infinite", params],
    queryFn: ({ pageParam = 1 }) => {
      return api.meals.browseMeals({ ...params, page: pageParam, limit: 20 });
    },
    getNextPageParam: (lastPage) => {
      // If we have more pages, return next page number
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // No more pages
    },
    initialPageParam: 1,
  });
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: ["meals", id],
    queryFn: () => api.meals.getMealById(Number(id)),
    enabled: !!id,
  });
}

/**
 * Hook to fetch nearby meals based on GPS coordinates
 * @param latitude - User's latitude (null to disable query)
 * @param longitude - User's longitude (null to disable query)
 * @param radius - Search radius in kilometers (default: 10)
 * @param limit - Max number of results (default: 20)
 */
export function useNearbyMeals(
  latitude: number | null,
  longitude: number | null,
  radius: number = 10,
  limit: number = 20,
) {
  const location = useAtomValue(locationAtom);
  const city = location?.coords ? undefined : location?.city;
  return useQuery({
    queryKey: ["meals", "nearby", latitude, longitude, radius, limit, city],
    queryFn: async () => {
      if ((latitude === null || longitude === null) && !city) {
        return [];
      }

      const params: BrowseMealsParams = {
        ...(latitude !== null && longitude !== null
          ? { latitude, longitude, radius }
          : { city }),
        limit,
        sort_by: city ? "created_at" : "distance",
        available_only: true,
      };

      const result = await api.meals.browseMeals(params);
      console.log("📍 Nearby meals:", result.data?.length || 0);
      return result.data || [];
    },
    enabled: !!city || (latitude !== null && longitude !== null),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
