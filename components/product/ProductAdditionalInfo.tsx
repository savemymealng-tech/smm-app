import { View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { Meal } from "@/types/api";

interface ProductAdditionalInfoProps {
  product: Meal;
}

export function ProductAdditionalInfo({
  product,
}: ProductAdditionalInfoProps) {
  // Meal type has expiry_date, quantity_available, weight
  const hasAdditionalInfo =
    product.expiry_date ||
    product.quantity_available > 0 ||
    product.weight;

  if (!hasAdditionalInfo) {
    return null;
  }

  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-900 mb-4">
        Additional Information
      </Text>

      {product.expiry_date && (
        <View className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
          <Text className="font-semibold text-gray-900 mb-1.5">
            Expiry Date
          </Text>
          <Text className="text-gray-700">{new Date(product.expiry_date).toLocaleDateString()}</Text>
        </View>
      )}

      {product.quantity_available > 0 && (
        <View className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
          <Text className="font-semibold text-gray-900 mb-2">Available</Text>
          <Text className="text-gray-700">{product.quantity_available} units in stock</Text>
        </View>
      )}

      {product.weight && (
        <View>
          <Text className="font-semibold text-gray-900 mb-2">Weight/Size</Text>
          <Text className="text-gray-700">{product.weight}</Text>
        </View>
      )}
    </View>
  );
}

