import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Vendor } from "../../types";
import { VendorCard } from "./VendorCard";

interface VendorsSectionProps {
  vendors: Vendor[];
}

export function VendorsSection({ vendors }: VendorsSectionProps) {
  if (vendors.length === 0) return null;

  return (
    <View className="mb-6 mt-4">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Matching Stores
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {vendors.length} store{vendors.length !== 1 ? "s" : ""} found
          </Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {vendors.slice(0, 10).map((vendor) => (
          <VendorCard key={vendor.id} item={vendor} />
        ))}
      </ScrollView>
    </View>
  );
}

