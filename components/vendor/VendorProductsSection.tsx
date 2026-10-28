import { useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { ProductCard } from "@/components/product/ProductCard";
import { palette } from "@/components/ui/screen-kit";
import type { Meal } from "@/types/api";

type VendorProductsSectionProps = {
  products: Meal[];
  label: string;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function VendorProductsSection({
  products,
  label,
  userLocation,
}: VendorProductsSectionProps) {
  const { width } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const cardWidth = ((containerWidth || width - 32) - 12) / 2;
  return (
    <View
      style={{ marginBottom: 16 }}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: "700",
            color: palette.ink,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: palette.muted }}>
          {products.length} {products.length === 1 ? "item" : "items"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {products.map((item) => (
          <View key={item.id} style={{ width: cardWidth }}>
            <ProductCard item={item} userLocation={userLocation} />
          </View>
        ))}
      </View>
    </View>
  );
}
