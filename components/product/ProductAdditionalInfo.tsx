import { View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { getEffectivePickupDay } from "@/lib/utils";
import type { Meal } from "@/types/api";

interface ProductAdditionalInfoProps {
  product: Meal;
}

export function ProductAdditionalInfo({
  product,
}: ProductAdditionalInfoProps) {
  // Meal type has expiry_date, quantity_available, weight, delivery_fee, available_for_pickup, available_for_delivery, pickup_start_time, pickup_end_time, pickup_day, delivery_time_minutes
  const hasAdditionalInfo =
    product.quantity_available > 0 ||
    product.available_for_delivery ||
    product.available_for_pickup;

  if (!hasAdditionalInfo) {
    return null;
  }

  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <Text className="text-lg font-bold text-gray-900 mb-4">
        Additional Information
      </Text>

      {/* Delivery/Pickup Information */}
      {product.available_for_delivery && (
        <View className="mb-4 pb-4 border-b border-gray-100">
          <View className="flex-row items-center mb-2">
            <IconSymbol name="shippingbox.fill" size={16} color="#1E8449" />
            <Text className="font-semibold text-gray-900 ml-2">
              Available for Delivery
            </Text>
          </View>
          <View className="ml-6">
            {product.delivery_fee && (
              <Text className="text-gray-700 mb-1">
                Delivery Fee: ₦{parseFloat(product.delivery_fee).toFixed(0)}
              </Text>
            )}
            {product.delivery_time_minutes && (
              <Text className="text-gray-700">
                Estimated Delivery: {product.delivery_time_minutes} minutes
              </Text>
            )}
          </View>
        </View>
      )}

      {product.available_for_pickup && (
        <View className="mb-4 pb-4 border-b border-gray-100">
          <View className="flex-row items-center mb-2">
            <IconSymbol name="bag.fill" size={16} color="#1E8449" />
            <Text className="font-semibold text-gray-900 ml-2">
              Available for Pickup
            </Text>
          </View>
          {product.pickup_start_time && product.pickup_end_time && (
            <Text className="text-gray-700 ml-6">
              Pickup {getEffectivePickupDay(product.pickup_day, product.pickup_end_time)}: {product.pickup_start_time} - {product.pickup_end_time}
            </Text>
          )}
        </View>
      )}

      {product.quantity_available > 0 && (
        <View className="mb-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
          <Text className="font-semibold text-gray-900 mb-2">Available</Text>
          <Text className="text-gray-700">{product.quantity_available} units in stock</Text>
        </View>
      )}
    </View>
  );
}

