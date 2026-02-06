import { router } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { getImageSource } from "@/lib/utils";
import type { Vendor } from "../../types";
import type { FeaturedVendor } from "../../types/api";

interface VendorCardProps {
  item: Vendor | FeaturedVendor;
}

export function VendorCard({ item }: VendorCardProps) {
  // Handle both rating types (string | number)
  const rating = typeof item.rating === 'string' ? parseFloat(item.rating) : item.rating;
  
  return (
    <Pressable
      onPress={() => router.push(`/vendor/${item.id}`)}
      className="items-center mr-4"
    >
      <View className="relative">
        <View className="w-20 h-20 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center overflow-hidden mb-2">
          <Image
            source={getImageSource(item.logo) || require('@/assets/images/default-profile.jpg')}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        {'isVerified' in item && item.isVerified && (
          <View className="absolute bottom-4 right-0 z-50 w-5 h-5 bg-white rounded-full items-center justify-center border-2 border-white">
            <IconSymbol name="checkmark" size={10} color="green" />
          </View>
        )}
      </View>
      <Text
        className="text-xs font-semibold text-gray-900 text-center max-w-[80px]"
        numberOfLines={2}
      >
        {item.business_name}
      </Text>
      {rating > 0 && (
        <View className="flex-row items-center mt-1">
          <IconSymbol name="star.fill" size={10} color={Colors.light.tint} />
          <Text className="text-xs text-gray-600 ml-0.5">
            {rating.toFixed(1)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

