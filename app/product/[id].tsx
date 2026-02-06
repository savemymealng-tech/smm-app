import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddToCartButton,
  ProductAdditionalInfo,
  ProductImageHeader,
  ProductInfoCard,
  VendorInfoCard
} from "@/components/product";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useMeal } from "@/lib/hooks";
import { useHybridAddToCart, useHybridCart } from "@/lib/hooks/use-hybrid-cart";

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useMeal(id || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, string[]>
  >({});
  const [showCartButton, setShowCartButton] = useState(false);
  
  const addToCartMutation = useHybridAddToCart();
  const { totalItems } = useHybridCart();

  if (isLoading) {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Skeleton className="w-full h-64" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Product not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }
  
  const handleAddToCart = () => {
    addToCartMutation.mutate({
      product_id: product.id,
      quantity,
      product, // Pass product for local cart
    });
  };

  // Debug log all product data
  console.log("Product Data:", { product });

  return (
    <View className="flex-1 bg-gray-50">
      <ProductImageHeader images={[product.photo_url]} />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 256, paddingBottom: 120 }}
      >
        {product.vendor && <VendorInfoCard vendor={product.vendor} />}

        <ProductInfoCard product={product} />

        <ProductAdditionalInfo product={product} />
      </ScrollView>

      {/* Floating Go to Cart Button - Shows when cart has items */}
      {totalItems > 0 && (
        <View
          className="absolute bottom-50 right-4 z-50"
        >
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={{
              backgroundColor: '#1E8449',
              borderRadius: 32,
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <IconSymbol name="cart.fill" size={28} color="white" />
            <View 
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#EF4444',
                borderRadius: 12,
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {totalItems}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <AddToCartButton
        product={product}
        quantity={quantity}
        selectedCustomizations={selectedCustomizations}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        isLoading={addToCartMutation.isPending}
      />
    </View>
  );
}
