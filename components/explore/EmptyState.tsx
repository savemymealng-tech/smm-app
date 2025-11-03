import { View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";

interface EmptyStateProps {
  hasSearchQuery: boolean;
}

export function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-20 px-4">
      <IconSymbol name="magnifyingglass" size={48} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
        {hasSearchQuery ? "No results found" : "Start searching"}
      </Text>
      <Text className="text-sm text-gray-500 text-center">
        {hasSearchQuery
          ? "Try adjusting your search or filters to find what you're looking for"
          : "Search for restaurants, dishes, or food items"}
      </Text>
    </View>
  );
}

