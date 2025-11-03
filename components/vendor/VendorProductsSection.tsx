import { FlatList, View } from "react-native";

import { ProductCard } from "@/components/explore/ProductCard";
import { Text } from "@/components/ui/text";
import { Product } from "@/types";

type VendorProductsSectionProps = {
  products: Product[];
  productsByCategory: Record<string, Product[]>;
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
      (p) => p.category === selectedCategory
    );

    return (
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          {selectedCategory}
        </Text>
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard item={item} />}
          keyExtractor={(item) => item.id}
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
    return (
      <>
        {categories.map((category) => {
          const categoryProducts = productsByCategory[category];
          if (!categoryProducts || categoryProducts.length === 0) return null;

          return (
            <View key={category} className="mb-6">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                {category}
              </Text>
              <FlatList
                data={categoryProducts}
                renderItem={({ item }) => <ProductCard item={item} />}
                keyExtractor={(item) => item.id}
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
        data={products}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </View>
  );
}

