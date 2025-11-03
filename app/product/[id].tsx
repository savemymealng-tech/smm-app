import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddToCartButton,
  ProductAdditionalInfo,
  ProductCustomizations,
  ProductImageHeader,
  ProductInfoCard,
  VendorInfoCard,
} from "@/components/product";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useProduct } from "@/lib/hooks/use-products";
import { useVendor } from "@/lib/hooks/use-vendors";

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: vendor } = useVendor(product?.vendorId || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, string[]>
  >({});

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
      </View>
    );
  }

  const toggleCustomization = (customizationId: string, optionId: string) => {
    const customization = product.customizations?.find(
      (c) => c.id === customizationId
    );
    if (!customization) return;

    if (customization.type === "single") {
      setSelectedCustomizations({
        ...selectedCustomizations,
        [customizationId]: [optionId],
      });
    } else {
      const current = selectedCustomizations[customizationId] || [];
      const newSelection = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setSelectedCustomizations({
        ...selectedCustomizations,
        [customizationId]: newSelection,
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <ProductImageHeader images={product.images} />

        {vendor && <VendorInfoCard vendor={vendor} />}

        <ProductInfoCard product={product} />

        {product.customizations && product.customizations.length > 0 && (
          <ProductCustomizations
            customizations={product.customizations}
            selectedCustomizations={selectedCustomizations}
            onToggleCustomization={toggleCustomization}
          />
        )}

        <ProductAdditionalInfo product={product} />
      </ScrollView>

      <AddToCartButton
        product={product}
        quantity={quantity}
        selectedCustomizations={selectedCustomizations}
        onQuantityChange={setQuantity}
      />
    </View>
  );
}
