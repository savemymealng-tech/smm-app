import { useRouter } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { CarouselComponent } from "@/components/ui/carousel";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface ProductImageHeaderProps {
  images: string[];
}

export function ProductImageHeader({ images }: ProductImageHeaderProps) {
  const router = useRouter();

  const renderImage = (item: string) => (
    <Image source={item ? { uri: item } : require('@/assets/images/default-product.jpg')} className="w-full h-64" resizeMode="cover" />
  );

  return (
    <View className="relative bg-white">
      <CarouselComponent
        data={images}
        renderItem={renderImage}
        itemWidth={400}
        showPagination={false}
        autoplay={false}
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

