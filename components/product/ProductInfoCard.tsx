import { View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import type { Meal } from "@/types/api";

interface ProductInfoCardProps {
  product: Meal;
}

export function ProductInfoCard({ product }: ProductInfoCardProps) {
  const price = parseFloat(product.price);
  const originalPrice = product.original_price ? parseFloat(product.original_price) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  
  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </Text>
          {product.average_rating      && (
            <View className="flex-row items-center">
              <IconSymbol name="star.fill" size={16} color="#fbbf24" />
              <Text className="ml-1.5 font-semibold text-gray-900">
                {parseFloat(product.average_rating).toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-baseline mb-3">
        <Text className="text-3xl font-bold text-[#1E8449]">
          ₦{price.toFixed(0)}
        </Text>
        {hasDiscount && (
          <>
            <Text className="text-gray-500 line-through text-lg ml-2">
              ₦{originalPrice?.toFixed(0)}
            </Text>
            <Badge
              variant="destructive"
              className="ml-3 bg-red-100 border-0"
            >
              <Text className="text-red-700 text-xs font-bold">
                {Math.round(((originalPrice! - price) / originalPrice!) * 100)}% OFF
              </Text>
            </Badge>
          </>
        )}
      </View>

      <Text className="text-gray-700 leading-6 text-base">
        {product.description}
      </Text>
      
      {/* Categories */}
      {product.categories && Array.isArray(product.categories) && product.categories.length > 0 && (
        <View className="flex-row flex-wrap mt-3 gap-2">
          {product.categories.map((category) => (
            <Badge key={category.id} variant="outline" className="bg-blue-50 border-blue-200">
              <Text className="text-blue-700 text-xs">{category.name}</Text>
            </Badge>
          ))}
        </View>
      )}
      
      {/* Tags */}
      {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
        <View className="flex-row flex-wrap mt-3 gap-2">
          {product.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary">
              <Text className="text-xs">{tag}</Text>
            </Badge>
          ))}
        </View>
      )}
    </View>
  );
}

