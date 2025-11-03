import React from 'react';
import { Dimensions, View } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { Text } from './text';

type CarouselProps<T> = {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  itemWidth?: number;
  sliderWidth?: number;
  onSnapToItem?: (index: number) => void;
  showPagination?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  mode?: 'horizontal-stack' | 'vertical-stack';
  modeConfig?: {
    snapDirection?: 'left' | 'right';
    stackInterval?: number;
  };
  scrollAnimationDuration?: number;
  withAnimation?: {
    type: 'spring' | 'timing';
    config: any;
  };
};

const { width: screenWidth } = Dimensions.get('window');

export function CarouselComponent<T>({
  data,
  renderItem,
  itemWidth = screenWidth * 0.8,
  sliderWidth = screenWidth,
  onSnapToItem,
  showPagination = true,
  loop = false,
  autoplay = false,
  autoplayInterval = 3000,
  mode,
  modeConfig = {
    snapDirection: 'left',
    stackInterval: 12,
  },
  scrollAnimationDuration = 300,
  withAnimation,
}: CarouselProps<T>) {
  const carouselRef = React.useRef<ICarouselInstance>(null);

  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-4">
        <Text className="text-slate-500">No items to display</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Carousel
        ref={carouselRef}
        loop={loop}
        width={itemWidth}
        height={180}
        autoPlay={autoplay}
        pagingEnabled={showPagination}
        autoPlayInterval={autoplayInterval}
        data={data}
        scrollAnimationDuration={scrollAnimationDuration}
        onSnapToItem={onSnapToItem}
        mode={mode}
        modeConfig={modeConfig}
        withAnimation={withAnimation}
        style={{
          width: sliderWidth,
        }}
        renderItem={({ item, index }) => (
          <View
            style={{ width: itemWidth }}
            className="justify-center items-center px-2"
          >
            {renderItem(item, index)}
          </View>
        )}
      />
    </View>
  );
}
