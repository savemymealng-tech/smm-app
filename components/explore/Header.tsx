import { router } from "expo-router";
import { ComponentProps } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Search, SlidersHorizontal } from "lucide-react-native";
import type { SortOption } from "../../types";

const sortFilters: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Top Rated", value: "rating" },
  { label: "Distance", value: "distance" },
  { label: "Delivery Time", value: "deliveryTime" },
];

interface HeaderProps extends Omit<ComponentProps<typeof View>, "children"> {
  searchQuery: string;
  onSearch: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  sort: SortOption;
  resultCount: number;
  onFilterPress: () => void;
  activeFilters: number;
}

export function Header({
  searchQuery,
  onSearch,
  onSortChange,
  sort,
  resultCount,
  onFilterPress,
  activeFilters,
  ...props
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      className="bg-white border-b border-gray-100"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <IconSymbol name="chevron.left" size={20} color="#111" />
        </Pressable>
        <View className="flex-1 mx-2">
          <Input
            placeholder="Search restaurants, dishes, or items..."
            value={searchQuery}
            onChangeText={onSearch}
            startContent={
              <Icon as={Search} size={18} className="text-gray-400" />
            }
            className="bg-gray-50"
          />
        </View>
        <Pressable
          onPress={onFilterPress}
          className="w-10 h-10 items-center justify-center relative"
        >
          <Icon as={SlidersHorizontal} size={20} className="text-gray-700" />
          {activeFilters > 0 && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {activeFilters}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-3"
      >
        {sortFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => onSortChange(filter.value)}
            className={`px-4 py-2 rounded-full mr-2 ${
              sort === filter.value ? "bg-primary" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                sort === filter.value ? "text-white" : "text-gray-700"
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {searchQuery && (
        <View className="px-4 pb-3">
          <Text className="text-sm text-gray-600">
            {resultCount > 0
              ? `Found ${resultCount} result${resultCount !== 1 ? "s" : ""}`
              : "No results found"}
          </Text>
        </View>
      )}
    </View>
  );
}

