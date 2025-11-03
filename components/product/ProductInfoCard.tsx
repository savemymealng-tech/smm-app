import { View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductInfoCardProps {
  product: Product;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>
          <View className="flex-row items-center">
            <IconSymbol name="star.fill" size={16} color="#fbbf24" />
            <Text className="ml-1.5 font-semibold text-gray-900">
              {product.rating}
            </Text>
            <Text className="text-gray-600 ml-2 text-sm">
              ({product.reviewCount.toLocaleString()} reviews)
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-baseline mb-3">
        <Text className="text-3xl font-bold text-blue-600">
          {formatCurrency(product.price)}
        </Text>
        {product.originalPrice && product.originalPrice > product.price && (
          <>
            <Text className="text-gray-500 line-through text-lg ml-2">
              {formatCurrency(product.originalPrice)}
            </Text>
            <Badge
              variant="destructive"
              className="ml-3 bg-red-100 border-0"
            >
              <Text className="text-red-700 text-xs font-bold">
                {Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )}
                % OFF
              </Text>
            </Badge>
          </>
        )}
      </View>

      {product.preparationTime && (
        <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
          <IconSymbol name="clock.fill" size={14} color="#666" />
          <Text className="text-sm text-gray-600 ml-1.5">
            Ready in {product.preparationTime} min
          </Text>
        </View>
      )}

      <Text className="text-gray-700 leading-6 text-base">
        {product.description}
      </Text>
    </View>
  );
}

