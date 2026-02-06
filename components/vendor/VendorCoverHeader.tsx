import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { getImageSource } from "@/lib/utils";

import { IconSymbol } from "@/components/ui/icon-symbol";

type VendorCoverHeaderProps = {
  coverImage?: string;
};

export function VendorCoverHeader({ coverImage }: VendorCoverHeaderProps) {
  const router = useRouter();

  const imageSource = getImageSource(coverImage) || require('@/assets/images/default-profile.jpg');
  console.log("VendorCoverHeader coverImage:", imageSource);

  return (
    <View 
      className="bg-gray-200 z-10"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        height: 120,
      }}
    >
      <Image
        source={imageSource}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      {/* Gradient Overlay */}
      <View 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          backgroundColor: 'transparent',
        }}
        className="bg-gradient-to-t from-black/20 to-transparent"
      />
      <Pressable
        onPress={() => router.back()}
        className="absolute top-12 left-4 bg-white/95 rounded-full p-2.5 shadow-sm"
      >
        <IconSymbol name="arrow.back" size={22} color="#000" />
      </Pressable>
    </View>
  );
}

