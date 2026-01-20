import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BrowseMealsParams } from '@/types/api';

export function useBrowseMeals(params?: BrowseMealsParams) {
  return useQuery({
    queryKey: ['meals', 'browse', params],
    queryFn: () => api.meals.browseMeals(params),
    enabled: true,
  });
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: ['meals', id],
    queryFn: () => api.meals.getMealById(Number(id)),
    enabled: !!id,
  });
}
