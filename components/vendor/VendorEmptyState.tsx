import { View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";

export function VendorEmptyState() {
  return (
    <View className="px-4 items-center py-12">
      <IconSymbol name="bag.fill" size={48} color="#9ca3af" />
      <Text className="text-gray-600 text-lg font-semibold mt-4">
        No products available
      </Text>
      <Text className="text-gray-500 text-sm mt-2 text-center">
        This vendor doesn't have any products yet.
      </Text>
    </View>
  );
}

