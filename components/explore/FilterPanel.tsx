import { ScrollView, View } from "react-native";

import type { Category } from "../../types";
import { FilterChip } from "./FilterChip";

interface FilterPanelProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  categories?: Category[];
}

export function FilterPanel({
  selectedCategory,
  onCategoryChange,
  minRating,
  onRatingChange,
  categories,
}: FilterPanelProps) {
  return (
    <View className="bg-white border-b border-gray-200 px-4 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row flex-wrap">
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
          {[4, 4.5].map((rating) => (
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
      </ScrollView>
    </View>
  );
}

