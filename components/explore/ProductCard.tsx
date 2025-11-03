import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, Pressable, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useCart } from "@/lib/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "../../types";

const { width } = Dimensions.get("window");
export const PRODUCT_CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface ProductCardProps {
  item: Product;
}

export function ProductCard({ item }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    addItem(item, 1, {});
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 mb-4"
      style={{ width: PRODUCT_CARD_WIDTH }}
    >
      <View className="relative">
        <Image
          source={{ uri: item.images[0] }}
          className="w-full"
          style={{ height: PRODUCT_CARD_WIDTH * 0.75 }}
          resizeMode="cover"
        />
        {item.originalPrice && item.originalPrice > item.price && (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-bold">
              {Math.round(
                ((item.originalPrice - item.price) / item.originalPrice) * 100
              )}
              % OFF
            </Text>
          </View>
        )}
        {!item.isAvailable && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-white/90 px-3 py-1.5 rounded-full">
              <Text className="text-gray-900 text-xs font-semibold">
                Unavailable
              </Text>
            </View>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text
          className="font-semibold text-sm mb-1 text-gray-900"
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.description && (
          <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            {item.rating > 0 && (
              <>
                <IconSymbol
                  name="star.fill"
                  size={12}
                  color={Colors.light.tint}
                />
                <Text className="text-xs text-gray-600 ml-1">
                  {item.rating.toFixed(1)}
                </Text>
                {item.reviewCount > 0 && (
                  <Text className="text-xs text-gray-400 ml-1">
                    ({item.reviewCount})
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {item.originalPrice && item.originalPrice > item.price ? (
              <View className="flex-row items-center">
                <Text className="font-bold text-base text-gray-900 mr-2">
                  {formatCurrency(item.price)}
                </Text>
                <Text className="text-xs text-gray-400 line-through">
                  {formatCurrency(item.originalPrice)}
                </Text>
              </View>
            ) : (
              <Text className="font-bold text-base text-gray-900">
                {formatCurrency(item.price)}
              </Text>
            )}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (item.isAvailable) {
                handleAddToCart();
              }
            }}
            disabled={!item.isAvailable}
            className={`w-9 h-9  rounded-full items-center justify-center shadow-sm ${
              isAdding
                ? "bg-green-600"
                : item.isAvailable
                ? "bg-primary"
                : "bg-gray-300 text-gray-800"
            }`}
          >
            <IconSymbol
              name={isAdding ? "checkmark" : "bag.fill"}
              size={18}
              color={
                isAdding ? "white" : item.isAvailable ? "#6b7280" : "#6b7280"
              }
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

