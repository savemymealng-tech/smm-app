import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { useCart } from "@/lib/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Product;
  quantity: number;
  selectedCustomizations: Record<string, string[]>;
  onQuantityChange: (newQuantity: number) => void;
}

export function AddToCartButton({
  product,
  quantity,
  selectedCustomizations,
  onQuantityChange,
}: AddToCartButtonProps) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  // Calculate total price including customizations
  const customizationPrice = Object.entries(selectedCustomizations).reduce(
    (sum, [customizationId, optionIds]) => {
      const customization = product.customizations?.find(
        (c) => c.id === customizationId
      );
      if (!customization) return sum;
      return (
        sum +
        optionIds.reduce((itemSum, optionId) => {
          const option = customization.options.find((o) => o.id === optionId);
          return itemSum + (option?.price || 0);
        }, 0)
      );
    },
    0
  );

  const totalPrice = (product.price + customizationPrice) * quantity;

  const handleAddToCart = async () => {
    if (!product.isAvailable) return;
    setIsAdding(true);
    addItem(product, quantity, selectedCustomizations);
    setTimeout(() => setIsAdding(false), 300);
  };

  if (!product.isAvailable) {
    return (
      <View
        className="bg-white border-t border-gray-200 px-4 py-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          disabled
          className="bg-gray-300 rounded-xl py-4 items-center justify-center"
        >
          <Text className="text-gray-600 font-semibold text-base">
            Currently Unavailable
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Total</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalPrice)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              if (quantity > 1) {
                onQuantityChange(quantity - 1);
              }
            }}
            disabled={quantity <= 1}
            className={`w-10 h-10 rounded-full border items-center justify-center ${
              quantity <= 1
                ? "border-gray-200 bg-gray-100"
                : "border-gray-300 bg-white"
            }`}
          >
            <IconSymbol
              name="minus"
              size={16}
              color={quantity <= 1 ? "#ccc" : "#666"}
            />
          </Pressable>
          <Text className="mx-4 text-lg font-semibold text-gray-900">
            {quantity}
          </Text>
          <Pressable
            onPress={() => {
              onQuantityChange(quantity + 1);
            }}
            className="w-10 h-10 rounded-full border border-gray-300 bg-white items-center justify-center"
          >
            <IconSymbol name="plus" size={16} color="#666" />
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={handleAddToCart}
        disabled={isAdding}
        className={`rounded-xl py-4 items-center justify-center ${
          isAdding ? "bg-green-600" : "bg-blue-600"
        }`}
      >
        {isAdding ? (
          <View className="flex-row items-center">
            <IconSymbol name="checkmark" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Added to Cart
            </Text>
          </View>
        ) : (
          <Text className="text-white font-semibold text-base">
            Add to Cart
          </Text>
        )}
      </Pressable>
    </View>
  );
}

