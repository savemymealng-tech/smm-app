import { useState } from "react";
import { Dimensions, Image, Modal, Pressable, View } from "react-native";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { getImageSource } from "@/lib/utils";
import { Vendor } from "@/types/api";

type VendorInfoCardProps = {
  vendor: Vendor;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VendorInfoCard({ vendor }: VendorInfoCardProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const imageSource = getImageSource(vendor.logo) || require('@/assets/images/default-profile.jpg');

  return (
    <>
      <View className="mx-4 -mt-24 mb-4 bg-white rounded-3xl p-5 shadow-lg border border-gray-100">
        <View className="flex-row items-start">
          <Pressable onPress={() => setPreviewVisible(true)}>
            <Avatar
              className="w-20 h-20 rounded-2xl border-4 border-white shadow-md"
              alt={vendor.business_name}
            >
              <AvatarImage source={imageSource} />
              <AvatarFallback className="bg-blue-100">
                <Text className="text-blue-600 font-bold text-2xl">
                  {vendor.business_name.charAt(0)}
                </Text>
              </AvatarFallback>
            </Avatar>
          </Pressable>

        <View className="flex-1 ml-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              {vendor.business_name}
            </Text>
            {vendor.verification_status === 'approved' && (
              <View className="ml-2 bg-blue-100 rounded-full p-1">
                <IconSymbol name="checkmark" size={16} color="#3b82f6" />
              </View>
            )}
          </View>

          <View className="flex-row items-center mb-2">
            <IconSymbol name="star.fill" size={16} color="#fbbf24" />
            <Text className="ml-1.5 font-semibold text-gray-900 text-base">
              {parseFloat(vendor.rating || '0').toFixed(1)}
            </Text>
            <Text className="text-gray-500 text-sm ml-1.5">
              ({vendor.total_orders?.toLocaleString() || 0} orders)
            </Text>
          </View>

          {/* Featured Badge */}
          {vendor.is_featured && (
            <View className="mb-3">
              <Badge variant="outline" className="bg-amber-50 border-amber-200 self-start">
                <IconSymbol name="star.fill" size={10} color="#f59e0b" />
                <Text className="text-amber-700 text-xs ml-1">Featured</Text>
              </Badge>
            </View>
          )}

          {/* Vendor Stats */}
          {vendor.distance && (
            <View className="flex-row items-center mb-3">
              <IconSymbol name="location.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5">
                {vendor.distance} away
              </Text>
            </View>
          )}

          {/* Address */}
          {vendor.address && (
            <View className="flex-row items-start mb-3">
              <IconSymbol name="map.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5 flex-1">
                {vendor.address}
              </Text>
            </View>
          )}

          {/* Contact Info */}
          {vendor.phone && (
            <View className="flex-row items-center mb-3">
              <IconSymbol name="phone.fill" size={14} color="#666" />
              <Text className="text-xs text-gray-600 ml-1.5">
                {vendor.phone}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>

    {/* Image Preview Modal */}
    <Modal
      visible={previewVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPreviewVisible(false)}
    >
      <View className="flex-1 bg-black">
        <Image
          source={imageSource}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode="contain"
        />
        
        <Pressable
          onPress={() => setPreviewVisible(false)}
          className="absolute top-12 right-4 bg-white/20 rounded-full p-3"
        >
          <IconSymbol name="xmark" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  </>
  );
}

