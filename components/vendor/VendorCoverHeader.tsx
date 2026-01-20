import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

type VendorCoverHeaderProps = {
  coverImage?: string;
};

export function VendorCoverHeader({ coverImage }: VendorCoverHeaderProps) {
  const router = useRouter();

  if (coverImage) {
    return (
      <View className="relative w-full h-56">
        <Image
          source={coverImage ? { uri: coverImage } : require('@/assets/images/default-profile.jpg')}
          className="w-full h-full"
          resizeMode="cover"
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

  return (
    <View className="relative bg-blue-500 h-48">
      <Pressable
        onPress={() => router.back()}
        className="absolute top-12 left-4 bg-white/95 rounded-full p-2.5 shadow-sm z-10"
      >
        <IconSymbol name="arrow.back" size={22} color="#000" />
      </Pressable>
    </View>
  );
}

