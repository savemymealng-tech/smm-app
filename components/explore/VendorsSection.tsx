import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Vendor } from "../../types";
import type { FeaturedVendor } from "../../types/api";
import { VendorCard } from "./VendorCard";

interface VendorsSectionProps {
  vendors: (Vendor | FeaturedVendor)[];
}

export function VendorsSection({ vendors }: VendorsSectionProps) {
  if (vendors.length === 0) return null;

  return (
    <View className="mb-6 mt-4">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View>
          <Text className="text-lg font-bold text-gray-900">
            Matching Stores
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {vendors.length} store{vendors.length !== 1 ? "s" : ""} found
          </Text>
        </View>
      </View>

      <View
        
        className="flex-row flex-wrap justify-between px-4"
      >
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} item={vendor} />
        ))}
      </View>
    </View>
  );
}

