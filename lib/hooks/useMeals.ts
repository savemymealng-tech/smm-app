import { api } from '@/lib/api';
import type { BrowseMealsParams } from '@/types/api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export function useBrowseMeals(params?: BrowseMealsParams) {
  return useQuery({
    queryKey: ['meals', 'browse', params],
    queryFn: () => api.meals.browseMeals(params),
    enabled: true,
  });
}

export function useBrowseMealsInfinite(params?: Omit<BrowseMealsParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['meals', 'browse-infinite', params],
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
    queryKey: ['meals', id],
    queryFn: () => api.meals.getMealById(Number(id)),
    enabled: !!id,
  });
}
