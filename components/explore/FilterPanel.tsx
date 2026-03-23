import { ScrollView, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useState } from "react";
import type { Category } from "../../types";
import { FilterChip } from "./FilterChip";

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
  // Location filtering
  useLocationFilter?: boolean;
  onLocationFilterChange?: (enabled: boolean) => void;
  locationRadius?: number;
  onRadiusChange?: (radius: number) => void;
  currentAddress?: string | null;
  isLoadingLocation?: boolean;
}

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Dairy-Free'];
const RADIUS_OPTIONS = [5, 10, 15, 20, 50];

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
  useLocationFilter = false,
  onLocationFilterChange,
  locationRadius = 10,
  onRadiusChange,
  currentAddress,
  isLoadingLocation = false,
}: FilterPanelProps) {
  const [customRadius, setCustomRadius] = useState("");
  
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
        {/* Location Filter */}
        {onLocationFilterChange && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Location</Text>
            <View className="mb-3">
              <FilterChip
                label={
                  isLoadingLocation 
                    ? "📍 Getting location..." 
                    : useLocationFilter 
                    ? "📍 Near Me" 
                    : "🌍 Show All"
                }
                isActive={useLocationFilter}
                onPress={() => onLocationFilterChange(!useLocationFilter)}
              />
              {useLocationFilter && currentAddress && (
                <View className="flex-row items-center mt-2 px-1">
                  <IconSymbol name="location.fill" size={12} color={Colors.light.tint} />
                  <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                    {currentAddress}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Radius Selector - Only show when location filter is ON */}
            {useLocationFilter && onRadiusChange && (
              <View>
                <Text className="text-xs text-gray-600 mb-2">Search Radius</Text>
                <View className="flex-row flex-wrap mb-3">
                  {RADIUS_OPTIONS.map((radius) => (
                    <FilterChip
                      key={radius}
                      label={`${radius} km`}
                      isActive={locationRadius === radius}
                      onPress={() => {
                        onRadiusChange(radius);
                        setCustomRadius(""); // Clear custom input when preset is selected
                      }}
                    />
                  ))}
                </View>
                
                {/* Custom Radius Input */}
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-600 mr-2">Custom:</Text>
                  <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <TextInput
                      placeholder="Enter km"
                      keyboardType="numeric"
                      value={customRadius}
                      onChangeText={(text) => {
                        setCustomRadius(text);
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0 && value <= 200) {
                          onRadiusChange(value);
                        }
                      }}
                      className="flex-1 text-sm text-gray-900"
                      placeholderTextColor="#9ca3af"
                      maxLength={3}
                    />
                    {customRadius && !RADIUS_OPTIONS.includes(locationRadius) && (
                      <View className="ml-2 bg-[#1E8449]/10 px-2 py-1 rounded">
                        <Text className="text-xs font-medium text-[#1E8449]">
                          {locationRadius} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className="text-[10px] text-gray-400 mt-1 ml-14">
                  Max: 200 km
                </Text>
              </View>
            )}
          </View>
        )}

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
                onChangeText={(text) => onPriceChange(text ? parseInt(text) : null, maxPrice ?? null)}
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-gray-500">-</Text>
              <TextInput
                placeholder="Max"
                keyboardType="numeric"
                value={maxPrice?.toString() || ''}
                onChangeText={(text) => onPriceChange(minPrice ?? null, text ? parseInt(text) : null)}
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

