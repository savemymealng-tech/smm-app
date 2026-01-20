import { router } from "expo-router";
import { ComponentProps } from "react";
import { Pressable, ScrollView, TextInput, TouchableOpacity, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      {...props}
      className="bg-white dark:bg-gray-900"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <IconSymbol 
            name="chevron.left" 
            size={24} 
            color={isDark ? '#ffffff' : '#111827'} 
          />
        </Pressable>
        <View className="flex-1 mx-2">
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
            <Search size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
            <TextInput
              placeholder="Search dishes or restaurants"
              value={searchQuery}
              onChangeText={onSearch}
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              style={{
                flex: 1,
                height: 40,
                marginLeft: 8,
                fontSize: 15,
                color: isDark ? '#ffffff' : '#111827',
                fontWeight: '400',
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => onSearch("")}>
                <IconSymbol 
                  name="xmark.circle.fill" 
                  size={18} 
                  color={isDark ? '#9ca3af' : '#6b7280'} 
                />
              </Pressable>
            )}
          </View>
        </View>
        <Pressable
          onPress={onFilterPress}
          className="w-10 h-10 items-center justify-center relative bg-gray-50 dark:bg-gray-800 rounded-full"
        >
          <SlidersHorizontal size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
          {activeFilters > 0 && (
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full items-center justify-center border-2 border-white dark:border-gray-900">
              <Text className="text-white text-[10px] font-bold">
                {activeFilters}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 pb-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {sortFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            onPress={() => onSortChange(filter.value)}
            className={`px-4 py-2 rounded-full border ${
              sort === filter.value
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                sort === filter.value 
                  ? "text-blue-700 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {searchQuery && (
        <View className="px-4 pb-3">
          <Text className="text-sm font-medium text-gray-900 dark:text-white">
            {resultCount > 0
              ? `${resultCount} result${resultCount !== 1 ? "s" : ""} found`
              : "No results found"}
          </Text>
        </View>
      )}
    </View>
  );
}

