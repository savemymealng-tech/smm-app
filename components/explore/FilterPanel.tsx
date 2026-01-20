import { ScrollView, View, TextInput } from "react-native";

import type { Category } from "../../types";
import { FilterChip } from "./FilterChip";
import { Text } from "@/components/ui/text";

interface FilterPanelProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  categories?: Category[];
  minPrice?: number | null;
  maxPrice?: number | null;
  onPriceChange?: (min: number | null, max: number | null) => void;
  dietaryPreferences?: string[];
  onDietaryChange?: (preferences: string[]) => void;
}

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Dairy-Free'];

export function FilterPanel({
  selectedCategory,
  onCategoryChange,
  minRating,
  onRatingChange,
  categories,
  minPrice,
  maxPrice,
  onPriceChange,
  dietaryPreferences = [],
  onDietaryChange,
}: FilterPanelProps) {
  const handleDietaryToggle = (option: string) => {
    if (!onDietaryChange) return;
    
    if (dietaryPreferences.includes(option)) {
      onDietaryChange(dietaryPreferences.filter(p => p !== option));
    } else {
      onDietaryChange([...dietaryPreferences, option]);
    }
  };

  return (
    <View className="bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              <FilterChip
                label="All"
                isActive={!selectedCategory}
                onPress={() => onCategoryChange(null)}
              />
              {categories?.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  isActive={selectedCategory === cat.id}
                  onPress={() =>
                    onCategoryChange(selectedCategory === cat.id ? null : cat.id)
                  }
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Rating */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Minimum Rating</Text>
          <View className="flex-row flex-wrap">
            {[3, 4, 4.5].map((rating) => (
              <FilterChip
                key={rating}
                label={`${rating}+ ⭐`}
                isActive={minRating === rating}
                onPress={() =>
                  onRatingChange(minRating === rating ? null : rating)
                }
              />
            ))}
          </View>
        </View>

        {/* Price Range */}
        {onPriceChange && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Price Range (₦)</Text>
            <View className="flex-row items-center space-x-2">
              <TextInput
                placeholder="Min"
                keyboardType="numeric"
                value={minPrice?.toString() || ''}
                onChangeText={(text) => onPriceChange(text ? parseInt(text) : null, maxPrice)}
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-gray-500">-</Text>
              <TextInput
                placeholder="Max"
                keyboardType="numeric"
                value={maxPrice?.toString() || ''}
                onChangeText={(text) => onPriceChange(minPrice, text ? parseInt(text) : null)}
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}

        {/* Dietary Preferences */}
        {onDietaryChange && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Dietary Preferences</Text>
            <View className="flex-row flex-wrap">
              {DIETARY_OPTIONS.map((option) => (
                <FilterChip
                  key={option}
                  label={option}
                  isActive={dietaryPreferences.includes(option)}
                  onPress={() => handleDietaryToggle(option)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

