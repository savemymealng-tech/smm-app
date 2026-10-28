import { AppImage as Image } from '@/components/ui/app-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';

import { CarouselComponent } from '@/components/ui/carousel';
import { X } from 'lucide-react-native';
import { getImageSource } from '@/lib/utils';

interface ProductImageHeaderProps {
  images: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ProductImageHeader({ images }: ProductImageHeaderProps) {
  const insets = useSafeAreaInsets();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const renderImage = (item: string, index?: number) => (
    <Pressable
      onPress={() => {
        if (index !== undefined) setSelectedImageIndex(index);
        setPreviewVisible(true);
      }}
    >
      <Image
        source={
          getImageSource(item) || require('@/assets/images/default-product.jpg')
        }
        fallbackSource={require('@/assets/images/default-product.jpg')}
        style={{ width: SCREEN_WIDTH, height: 180 }}
        resizeMode="cover"
      />
    </Pressable>
  );

  return (
    <>
      <View
        className="bg-white"
        style={{
          paddingTop: insets.top,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <CarouselComponent
          data={images}
          renderItem={(item, index) => renderImage(item, index)}
          itemWidth={SCREEN_WIDTH}
          showPagination={false}
          autoplay={false}
        />
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
            source={
              getImageSource(images[selectedImageIndex]) ||
              require('@/assets/images/default-product.jpg')
            }
            fallbackSource={require('@/assets/images/default-product.jpg')}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
          />

          <Pressable
            onPress={() => setPreviewVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close product image"
            style={{
              position: 'absolute',
              top: insets.top + 12,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              elevation: 4,
            }}
          >
            <X size={22} color="#17251d" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
