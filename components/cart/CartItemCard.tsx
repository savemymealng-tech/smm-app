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
import { formatCurrency } from "@/lib/utils";
import { FadeIn } from "react-native-reanimated";
import type { CartItem } from "../../types";

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

export function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: CartItemCardProps) {
  const hasCustomizations = Object.keys(item.customizations || {}).length > 0;
  const scale = useSharedValue(1);
  const quantityScale = useSharedValue(1);

  const customizationDetails = Object.entries(item.customizations || {})
    .map(([key, valueIds]) => {
      const customization = item.product.customizations?.find(
        (c) => c.id === key
      );
      if (!customization) return null;

      const selectedOptions = valueIds
        .map((id) => customization.options.find((o) => o.id === id))
        .filter(Boolean)
        .map((o) => o!.name);

      return `${customization.name}: ${selectedOptions.join(", ")}`;
    })
    .filter(Boolean);

  const handleQuantityChange = (newQuantity: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    quantityScale.value = withSpring(1.2, {}, () => {
      quantityScale.value = withSpring(1);
    });
    onUpdateQuantity(item.id, newQuantity);
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
            source={{
              uri: item.product.images[0] || "https://via.placeholder.com/100",
            }}
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
                {item.product.name}
              </Text>
              {item.product.description && (
                <Text className="text-gray-500 text-sm" numberOfLines={1}>
                  {item.product.description}
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

          {/* Customizations */}
          {hasCustomizations && customizationDetails.length > 0 && (
            <View className="mt-2 mb-2">
              {customizationDetails.map((detail, idx) => (
                <Text key={idx} className="text-gray-500 text-xs mb-0.5">
                  {detail}
                </Text>
              ))}
            </View>
          )}

          {/* Quantity and Price */}
          <View className="flex-row justify-between items-center mt-3">
            <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1">
              <Pressable
                onPress={() => handleQuantityChange(item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm active:bg-gray-50"
              >
                <IconSymbol name="minus" size={14} color="#666" />
              </Pressable>
              <Animated.View style={animatedQuantityStyle}>
                <Text className="text-gray-900 font-bold text-base mx-4 min-w-[24px] text-center">
                  {item.quantity}
                </Text>
              </Animated.View>
              <Pressable
                onPress={() => handleQuantityChange(item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-primary items-center justify-center shadow-sm active:opacity-80"
              >
                <IconSymbol name="plus" size={14} color="white" />
              </Pressable>
            </View>
            <View className="items-end">
              <Text className="text-gray-900 font-bold text-lg">
                {formatCurrency(item.totalPrice)}
              </Text>
              {item.quantity > 1 && (
                <Text className="text-gray-400 text-xs">
                  {formatCurrency(item.unitPrice)} each
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

