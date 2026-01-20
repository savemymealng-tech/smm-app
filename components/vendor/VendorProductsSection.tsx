import { FlatList, View } from "react-native";

import { ProductCard } from "@/components/explore/ProductCard";
import { Text } from "@/components/ui/text";
import { Meal } from "@/types/api";

type VendorProductsSectionProps = {
  products: Meal[];
  productsByCategory: Record<string, Meal[]>;
  categories: string[];
  selectedCategory: string | null;
};

export function VendorProductsSection({
  products,
  productsByCategory,
  categories,
  selectedCategory,
}: VendorProductsSectionProps) {
  if (selectedCategory) {
    // Show filtered products for selected category
    const filteredProducts = products.filter(
      (p) => p && p.categories?.some(c => c.name === selectedCategory) && p.id
    );

    return (
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          {selectedCategory}
        </Text>
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => {
            if (!item || !item.id) return <View />;
            return <ProductCard item={item} />;
          }}
          keyExtractor={(item, index) => String(item?.id) || `product-${index}`}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </View>
    );
  }

  // Show grouped by category if no category is selected
  if (categories.length > 1) {
    // Filter out empty categories first
    const nonEmptyCategories = categories.filter(
      (category) => productsByCategory[category] && productsByCategory[category].length > 0
    );

    return (
      <>
        {nonEmptyCategories.map((category) => {
          const categoryProducts = productsByCategory[category];

          return (
            <View key={category} className="mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                {category}
              </Text>
              <FlatList
                data={categoryProducts}
                renderItem={({ item }) => {
                  if (!item || !item.id) return <View />;
                  return <ProductCard item={item} />;
                }}
                keyExtractor={(item, index) => String(item?.id) || `product-${index}`}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                contentContainerStyle={{ paddingBottom: 8 }}
              />
            </View>
          );
        })}
      </>
    );
  }

  // Show all products in a single grid if only one category
  return (
    <View className="mb-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">Menu</Text>
      <FlatList
        data={products.filter((p) => p && p.id)}
        renderItem={({ item }) => {
          if (!item || !item.id) return <View />;
          return <ProductCard item={item} />;
        }}
        keyExtractor={(item, index) => String(item?.id) || `product-${index}`}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </View>
  );
}

