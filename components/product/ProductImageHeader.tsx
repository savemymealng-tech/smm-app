import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, Modal, Pressable, View } from "react-native";

import { CarouselComponent } from "@/components/ui/carousel";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getImageSource } from "@/lib/utils";

interface ProductImageHeaderProps {
  images: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ProductImageHeader({ images }: ProductImageHeaderProps) {
  const router = useRouter();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const renderImage = (item: string, index?: number) => (
    <Pressable onPress={() => {
      if (index !== undefined) setSelectedImageIndex(index);
      setPreviewVisible(true);
    }}>
      <Image source={getImageSource(item) || require('@/assets/images/default-product.jpg')} className="w-full h-64" resizeMode="cover" />
    </Pressable>
  );

  return (
    <>
      <View 
        className="bg-white"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <CarouselComponent
          data={images}
          renderItem={(item, index) => renderImage(item, index)}
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

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View className="flex-1 bg-black">
          <Image
            source={getImageSource(images[selectedImageIndex]) || require('@/assets/images/default-product.jpg')}
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

