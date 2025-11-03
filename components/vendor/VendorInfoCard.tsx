import { View } from "react-native";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/lib/utils";
import { Vendor } from "@/types";

type VendorInfoCardProps = {
  vendor: Vendor;
};

export function VendorInfoCard({ vendor }: VendorInfoCardProps) {
  return (
    <View className="mx-4 -mt-12 mb-4 bg-white rounded-3xl p-5 shadow-lg border border-gray-100">
      <View className="flex-row items-start">
        <Avatar
          className="w-20 h-20 rounded-2xl border-4 border-white shadow-md"
          alt={vendor.name}
        >
          <AvatarImage source={{ uri: vendor.logo }} />
          <AvatarFallback className="bg-blue-100">
            <Text className="text-blue-600 font-bold text-2xl">
              {vendor.name.charAt(0)}
            </Text>
          </AvatarFallback>
        </Avatar>

        <View className="flex-1 ml-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              {vendor.name}
            </Text>
            {vendor.isVerified && (
              <View className="ml-2 bg-blue-100 rounded-full p-1">
                <IconSymbol name="checkmark" size={16} color="#3b82f6" />
              </View>
            )}
          </View>

          <View className="flex-row items-center mb-2">
            <IconSymbol name="star.fill" size={16} color="#fbbf24" />
            <Text className="ml-1.5 font-semibold text-gray-900 text-base">
              {vendor.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 text-sm ml-1.5">
              ({vendor.reviewCount.toLocaleString()} reviews)
            </Text>
          </View>

          {vendor.description && (
            <Text className="text-gray-600 text-sm mb-3 leading-5">
              {vendor.description}
            </Text>
          )}

          {/* Vendor Stats */}
          <View className="flex-row items-center flex-wrap gap-3 mb-3">
            <View className="flex-row items-center">
              <IconSymbol name="clock.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5">
                {vendor.deliveryTime} min
              </Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="car.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5">
                {formatCurrency(vendor.deliveryFee)} delivery
              </Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol
                name="dollarsign.circle.fill"
                size={14}
                color="#666"
              />
              <Text className="text-xs text-gray-600 ml-1.5">
                Min. {formatCurrency(vendor.minOrder)}
              </Text>
            </View>
          </View>

          {/* Open/Closed Status */}
          <View className="flex-row items-center mb-3">
            {vendor.isOpen ? (
              <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-green-700 font-semibold text-xs">
                  Open Now
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-full">
                <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                <Text className="text-red-700 font-semibold text-xs">
                  Closed
                </Text>
              </View>
            )}
          </View>

          {/* Address */}
          {vendor.address && (
            <View className="flex-row items-start mb-3">
              <IconSymbol name="location.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5 flex-1">
                {vendor.address}
              </Text>
            </View>
          )}

          {/* Cuisine Tags */}
          {vendor.cuisine && vendor.cuisine.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {vendor.cuisine.map((cuisine, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-gray-50 border-gray-200"
                >
                  <Text className="text-gray-700 text-xs">{cuisine}</Text>
                </Badge>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

