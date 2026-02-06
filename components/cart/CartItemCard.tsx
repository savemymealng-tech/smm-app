import * as Haptics from "expo-haptics";
import { Image, Platform, Pressable, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { Text } from "@/components/ui/text";
import { getImageSource } from "@/lib/utils";
import type { CartItem as LocalCartItem } from "@/types";
import type { CartItem } from "@/types/api";
import { FadeIn } from "react-native-reanimated";

interface CartItemCardProps {
  item: CartItem | LocalCartItem;
  isAuthenticated?: boolean;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

export function CartItemCard({
  item,
  isAuthenticated = true,
  onRemove,
  onUpdateQuantity,
}: CartItemCardProps) {
  const scale = useSharedValue(1);
  const quantityScale = useSharedValue(1);

  // Handle both API cart (item.product.price) and local cart (item.unitPrice)
  const price = isAuthenticated 
    ? parseFloat((item as CartItem).product.price)
    : (item as LocalCartItem).unitPrice;
  const quantity = item.quantity;
  const totalPrice = isAuthenticated 
    ? price * quantity
    : (item as LocalCartItem).totalPrice;
  const product = item.product;
  const quantityAvailable = isAuthenticated
    ? (item as CartItem).product.quantity_available
    : (product as any).quantityAvailable || (product as any).quantity_available || 999;

  const handleQuantityChange = (newQuantity: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    quantityScale.value = withSpring(1.2, {}, () => {
      quantityScale.value = withSpring(1);
    });
    onUpdateQuantity(newQuantity);
  };

  const handleRemove = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scale.value = withTiming(0.95, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 100 });
    });
    onRemove();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedQuantityStyle = useAnimatedStyle(() => ({
    transform: [{ scale: quantityScale.value }],
  }));

  return (
    <Animated.View
      style={animatedCardStyle}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
    >
      <View className="flex-row">
        {/* Product Image */}
        <NativeOnlyAnimatedView entering={FadeIn.delay(100).duration(300)}>
          <Image
            source={
              getImageSource(
                (product as any).photo_url || (product as any).photoUrl || (product as any).images?.[0]
              ) || require('@/assets/images/default-product.jpg')
            }
            className="w-28 h-28 rounded-l-2xl"
            resizeMode="cover"
          />
        </NativeOnlyAnimatedView>

        {/* Product Details */}
        <View className="flex-1 p-4">
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1 mr-2">
              <Text
                className="font-bold text-base mb-1 text-gray-900"
                numberOfLines={1}
              >
                {product.name}
              </Text>
              {(product as any).vendor && (
                <Text className="text-gray-500 text-xs" numberOfLines={1}>
                  {(product as any).vendor.business_name || (product as any).vendor.name}
                </Text>
              )}
            </View>
            <Pressable
              onPress={handleRemove}
              className="w-9 h-9 rounded-full bg-red-50 items-center justify-center active:bg-red-100"
            >
              <IconSymbol name="trash" size={16} color="#ef4444" />
            </Pressable>
          </View>

          {/* Stock Warning */}
          {quantityAvailable < quantity && (
            <View className="bg-amber-50 px-2 py-1 rounded-md mb-2">
              <Text className="text-amber-700 text-xs">
                Only {quantityAvailable} available
              </Text>
            </View>
          )}

          {/* Quantity and Price */}
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1">
              <Pressable
                onPress={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className={`w-8 h-8 rounded-full items-center justify-center shadow-sm ${
                  quantity <= 1 ? 'bg-gray-200' : 'bg-white active:bg-gray-50'
                }`}
              >
                <IconSymbol name="minus" size={14} color={quantity <= 1 ? "#d1d5db" : "#666"} />
              </Pressable>
              <Animated.View style={animatedQuantityStyle}>
                <Text className="text-gray-900 font-bold text-base mx-4 min-w-[24px] text-center">
                  {quantity}
                </Text>
              </Animated.View>
              <Pressable
                onPress={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= quantityAvailable}
                className={`w-8 h-8 rounded-full items-center justify-center shadow-sm ${
                  quantity >= quantityAvailable 
                    ? 'bg-gray-200' 
                    : 'bg-[#1E8449] active:opacity-80'
                }`}
              >
                <IconSymbol 
                  name="plus" 
                  size={14} 
                  color={quantity >= quantityAvailable ? "#d1d5db" : "white"} 
                />
              </Pressable>
            </View>
            <View className="items-end">
              <Text className="text-gray-900 font-bold text-lg">
                ₦{totalPrice.toFixed(0)}
              </Text>
              {quantity > 1 && (
                <Text className="text-gray-400 text-xs">
                  ₦{price.toFixed(0)} each
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

