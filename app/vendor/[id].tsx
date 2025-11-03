import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import {
  CategoryFilter,
  VendorCoverHeader,
  VendorEmptyState,
  VendorInfoCard,
  VendorLoadingState,
  VendorProductsSection,
} from "@/components/vendor";
import { useProducts } from "@/lib/hooks/use-products";
import { useVendor } from "@/lib/hooks/use-vendors";

export default function VendorDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vendor, isLoading: isLoadingVendor } = useVendor(id || "");
  const { data: products, isLoading: isLoadingProducts } = useProducts(
    id || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (isLoadingVendor) {
    return <VendorLoadingState />;
  }

  if (!vendor) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg text-gray-600">Vendor not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Group products by category
  const productsByCategory = useMemo(() => {
    if (!products) return {};
    const grouped: Record<string, typeof products> = {};
    products.forEach((product) => {
      const category = product.category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    return grouped;
  }, [products]);

  // Get unique categories
  const categories = useMemo(() => {
    return Object.keys(productsByCategory);
  }, [productsByCategory]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VendorCoverHeader coverImage={vendor.coverImage} />
        <VendorInfoCard vendor={vendor} />

        {/* Products Section */}
        {isLoadingProducts ? (
          <View className="px-4">
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
          </View>
        ) : products && products.length > 0 ? (
          <View className="px-4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <VendorProductsSection
              products={products}
              productsByCategory={productsByCategory}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          </View>
        ) : (
          <VendorEmptyState />
        )}
      </ScrollView>
    </View>
  );
}
