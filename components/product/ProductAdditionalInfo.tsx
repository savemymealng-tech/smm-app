import { View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { Product } from "@/types";

interface ProductAdditionalInfoProps {
  product: Product;
}

export function ProductAdditionalInfo({
  product,
}: ProductAdditionalInfoProps) {
  const hasAdditionalInfo =
    product.calories ||
    (product.allergens && product.allergens.length > 0) ||
    (product.ingredients && product.ingredients.length > 0);

  if (!hasAdditionalInfo) {
    return null;
  }

  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-900 mb-4">
        Additional Information
      </Text>

      {product.calories && (
        <View className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
          <Text className="font-semibold text-gray-900 mb-1.5">
            Nutritional Info
          </Text>
          <Text className="text-gray-700">{product.calories} calories</Text>
        </View>
      )}

      {product.ingredients && product.ingredients.length > 0 && (
        <View className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
          <Text className="font-semibold text-gray-900 mb-2">Ingredients</Text>
          <View className="flex-row flex-wrap">
            {product.ingredients.map((ingredient, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="mr-2 mb-2 bg-gray-50 border-gray-200"
              >
                <Text className="text-gray-700 text-xs">{ingredient}</Text>
              </Badge>
            ))}
          </View>
        </View>
      )}

      {product.allergens && product.allergens.length > 0 && (
        <View>
          <Text className="font-semibold text-gray-900 mb-2">Allergens</Text>
          <View className="flex-row flex-wrap">
            {product.allergens.map((allergen, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="mr-2 mb-2 bg-red-50 border-red-200"
              >
                <Text className="text-red-700 text-xs font-medium">
                  {allergen}
                </Text>
              </Badge>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

