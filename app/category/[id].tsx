import { router, useLocalSearchParams } from "expo-router";
import { Dimensions, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/explore/ProductCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useCategory } from "@/lib/hooks/use-categories";
import { useCategoryProducts } from "@/lib/hooks/use-products";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = (screenWidth - 48) / 2; // 2 columns, 16px padding on each side + 16px gap

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: category, isLoading: loadingCategory } = useCategory(id);
  const {
    data: products,
    isLoading: loadingProducts,
    refetch,
    isRefetching,
    error,
  } = useCategoryProducts(id || '');
  
  // Debug logging
  console.log('==== CATEGORY PAGE DEBUG ====');
  console.log('Category ID:', id);
  console.log('Products type:', typeof products);
  console.log('Products is array?:', Array.isArray(products));
  console.log('Products data:', products);
  console.log('Products length:', products?.length);
  console.log('Loading Products:', loadingProducts);
  console.log('Loading Category:', loadingCategory);
  console.log('Error:', error);
  console.log('============================');

  return (
    
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-10 pb-4 flex-row items-center border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <IconSymbol name="chevron.left" size={24} color="#111" />
        </Pressable>
        {loadingCategory ? (
          <Skeleton className="h-6 w-32 ml-4" />
        ) : (
          <View className="ml-2 flex-row items-center flex-1">
            {category?.icon && (
              <Text className="text-2xl mr-2">{category.icon}</Text>
            )}
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {category?.name || "Category"}
              </Text>
              {category?.description && (
                <Text className="text-xs text-gray-500 mt-0.5">
                  {category.description}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      {loadingProducts && !products ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <View className="flex-row flex-wrap justify-between">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="rounded-2xl mb-4"
                  style={{
                    width: "48%",
                    height: 200,
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {products && products.length > 0 ? (
            <View className="py-4">
              <View className="mb-4 px-4">
                <Text className="text-lg font-bold text-gray-900">
                  {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                  available
                </Text>
              </View>
              <View className="px-4 flex-row flex-wrap justify-between">
                {products.map((product: any, index: number) => {
                  console.log(`Rendering product ${index}:`, product.id, product.name);
                  return (
                    <View 
                      key={product.id} 
                      style={{ 
                        width: CARD_WIDTH,
                        marginBottom: 16 
                      }}
                    >
                      <ProductCard item={product} />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#ef4444" />
              <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
                Error loading products
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                {error instanceof Error ? error.message : 'Something went wrong'}
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <IconSymbol name="bag.fill" size={48} color="#d1d5db" />
              <Text className="text-xl font-semibold text-gray-700 mt-4 mb-2">
                No products found
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                There are no products available in this category right now
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

