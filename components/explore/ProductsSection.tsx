import { Dimensions, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Meal } from "@/types/api";
import { ProductCard } from "./ProductCard";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = (screenWidth - 48) / 2;
interface ProductsSectionProps {
  products: Meal[];
}

export function ProductsSection({ products }: ProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <View className="px-4 mb-4">
      <View className="mb-4">
        <Text className="text-lg font-bold text-gray-900">Matching Items</Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {products.length} item{products.length !== 1 ? "s" : ""} found
        </Text>
      </View>
      <View className="flex-row flex-wrap justify-between">
        {products.map((product) => (
          <View 
            key={product.id} 
            style={{ 
              width: CARD_WIDTH,
              marginBottom: 16 
            }}
          >
            <ProductCard item={product} />
          </View>
        ))}
      </View>
    </View>
  );
}

