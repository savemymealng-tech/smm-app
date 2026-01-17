import { useQuery } from '@tanstack/react-query'
import { api } from "../api";
import type { Category } from '../../types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Get categories from meals endpoint
      // The server might return categories in the response
      // For now, we'll extract unique categories from meals
      const result = await api.meals.browseMeals({ limit: 1000 });
      const categoryMap = new Map<string, Category>();
      
      result.meals.forEach(meal => {
        if (meal.category && !categoryMap.has(meal.category)) {
          categoryMap.set(meal.category, {
            id: meal.category,
            name: meal.category.charAt(0).toUpperCase() + meal.category.slice(1),
            slug: meal.category.toLowerCase().replace(/\s+/g, '-'),
            description: `${meal.category} meals`,
          });
        }
      });
      
      return Array.from(categoryMap.values());
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      // Get categories by fetching meals and extracting the category
      const result = await api.meals.browseMeals({ limit: 1000 });
      const categoryMap = new Map<string, Category>();
      
      result.meals.forEach(meal => {
        if (meal.category && !categoryMap.has(meal.category)) {
          categoryMap.set(meal.category, {
            id: meal.category,
            name: meal.category.charAt(0).toUpperCase() + meal.category.slice(1),
            slug: meal.category.toLowerCase().replace(/\s+/g, '-'),
            description: `${meal.category} meals`,
          });
        }
      });
      
      const categories = Array.from(categoryMap.values());
      const category = categories.find(c => c.id === id || c.slug === id);
      if (!category) {
        throw new Error(`Category with id ${id} not found`);
      }
      return category;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

