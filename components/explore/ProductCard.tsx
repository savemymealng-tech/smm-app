import { router } from "expo-router";
import { Dimensions, Image, Pressable, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { getImageSource } from "@/lib/utils";
import type { Meal } from "@/types/api";

const { width } = Dimensions.get("window");
export const PRODUCT_CARD_WIDTH = width > 0 ? (width - 48) / 2 : 160; // 2 columns with padding, fallback to 160

interface ProductCardProps {
  item: Meal;
}

export function ProductCard({ item }: ProductCardProps) {
  // Safety check
  if (!item || !item.id) {
    return null;
  }

  const price = parseFloat(item.price);
  const originalPrice = item.original_price ? parseFloat(item.original_price) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 mb-4 w-full"
    >
      <View className="relative">
        <Image
          source={getImageSource(item.photo_url) || require('@/assets/images/default-product.jpg')}
          className="w-full h-40"
          resizeMode="cover"
        />
        {hasDiscount && (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-bold">
              {discountPercent}% OFF
            </Text>
          </View>
        )}
        {!item.is_available && (
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
            {item.vendor?.rating && (
              <>
                <IconSymbol
                  name="star.fill"
                  size={12}
                  color={Colors.light.tint}
                />
                <Text className="text-xs text-gray-600 ml-1">
                  {parseFloat(item.vendor.rating).toFixed(1)}
                </Text>
              </>
            )}
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {hasDiscount ? (
              <View className="flex-row items-center">
                {/* <Text className="font-bold text-base text-gray-900 mr-2">
                  ₦{price.toFixed(0)}
                </Text> */}
                <Text className="font-bold text-base text-gray-900 mr-1">
                  ₦{price.toFixed(0)}
                </Text>
                <Text className="text-xs text-gray-400 line-through">
                  ₦{originalPrice?.toFixed(0)}
                </Text>
              </View>
            ) : (
              <Text className="font-bold text-base text-gray-900">
                ₦{price.toFixed(0)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

