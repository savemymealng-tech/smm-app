import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";

type CategoryFilterProps = {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  if (categories.length <= 1) {
    return null;
  }

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <Pressable
          onPress={() => onSelectCategory(null)}
          className={`mr-2 px-4 py-2 rounded-full border-2 ${
            selectedCategory === null
              ? "bg-primary border-primary"
              : "bg-white border-gray-200"
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              selectedCategory === null ? "text-white" : "text-gray-700"
            }`}
          >
            All
          </Text>
        </Pressable>
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            className={`mr-2 px-4 py-2 rounded-full border-2 ${
              selectedCategory === category
                ? "bg-primary border-primary"
                : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                selectedCategory === category ? "text-white" : "text-gray-700"
              }`}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

