import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddToCartButton,
  ProductAdditionalInfo,
  ProductImageHeader,
  ProductInfoCard,
  VendorInfoCard
} from "@/components/product";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useMeal } from "@/lib/hooks";
import { useHybridAddToCart } from "@/lib/hooks/use-hybrid-cart";

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useMeal(id || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, string[]>
  >({});
  
  const addToCartMutation = useHybridAddToCart();

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
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ProductImageHeader images={[product.photo_url]} />

        {product.vendor && <VendorInfoCard vendor={product.vendor} />}

        <ProductInfoCard product={product} />

        <ProductAdditionalInfo product={product} />
      </ScrollView>

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
