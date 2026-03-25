import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { Vendor } from "../../types";
import type { FeaturedVendor } from "../../types/api";
import { VendorCard } from "./VendorCard";

interface VendorsSectionProps {
  vendors: (Vendor | FeaturedVendor)[];
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

export function VendorsSection({ vendors, userLocation }: VendorsSectionProps) {
  if (vendors.length === 0) return null;

  return (
    <View className="mb-6 mt-4">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View>
          <Text className="text-lg font-bold text-gray-900">
            Matching Vendors
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} found
          </Text>
        </View>
      </View>

      <View
        
        className="flex-row flex-wrap justify-between px-4"
      >
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} item={vendor} userLocation={userLocation} />
        ))}
      </View>
    </View>
  );
}

