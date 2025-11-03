import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/lib/utils";
import type { Vendor } from "@/types";

interface VendorInfoCardProps {
  vendor: Vendor;
}

export function VendorInfoCard({ vendor }: VendorInfoCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/vendor/${vendor.id}`)}
      className="mx-4 mt-4 mb-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center">
        <Avatar
          className="w-14 h-14 rounded-full border-2 border-blue-100"
          alt={vendor.name}
        >
          <AvatarImage source={{ uri: vendor.logo }} />
          <AvatarFallback className="bg-blue-100">
            <Text className="text-blue-600 font-bold text-lg">
              {vendor.name.charAt(0)}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg font-bold text-gray-900">
              {vendor.name}
            </Text>
            {vendor.isVerified && (
              <View className="ml-2 bg-blue-100 rounded-full p-0.5">
                <IconSymbol name="checkmark" size={14} color="#3b82f6" />
              </View>
            )}
          </View>
          <View className="flex-row items-center mb-1">
            <IconSymbol name="star.fill" size={14} color="#fbbf24" />
            <Text className="ml-1 text-sm font-semibold text-gray-900">
              {vendor.rating}
            </Text>
            <Text className="text-gray-500 text-sm ml-1.5">
              ({vendor.reviewCount.toLocaleString()} reviews)
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <IconSymbol name="clock.fill" size={13} color="#666" />
            <Text className="text-xs text-gray-600 ml-1">
              {vendor.deliveryTime} min
            </Text>
            <Text className="text-xs text-gray-400 mx-2">•</Text>
            <Text className="text-xs text-gray-600">
              {formatCurrency(vendor.deliveryFee)} delivery
            </Text>
            {vendor.isOpen ? (
              <>
                <Text className="text-xs text-gray-400 mx-2">•</Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                  <Text className="text-xs text-green-600 font-medium">
                    Open
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text className="text-xs text-gray-400 mx-2">•</Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                  <Text className="text-xs text-red-600 font-medium">
                    Closed
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#9ca3af" />
      </View>
    </Pressable>
  );
}

