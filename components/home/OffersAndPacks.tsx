import {
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { AppImage } from "@/components/ui/app-image";
import { ProductCard } from "@/components/product/ProductCard";
import { palette, ui } from "@/components/ui/screen-kit";
import { getImageSource } from "@/lib/utils";
import type { useHomeDiscovery } from "@/lib/hooks/use-discovery";
export function OffersAndPacks({
  query,
}: {
  query: ReturnType<typeof useHomeDiscovery>;
}) {
  const width = Math.min(290, useWindowDimensions().width - 48);
  if (query.isLoading)
    return (
      <ActivityIndicator
        color={palette.green}
        accessibilityLabel="Loading offers"
      />
    );
  if (query.isError)
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => void query.refetch()}
        style={{ paddingHorizontal: 16 }}
      >
        <Text style={ui.muted}>Offers could not load. Tap to retry.</Text>
      </Pressable>
    );
  return (
    <View style={{ gap: 22 }}>
      {!!query.data?.offers.length && (
        <View style={{ gap: 10 }}>
          <Text style={[ui.heading, { paddingHorizontal: 16 }]}>
            Offers for you
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {query.data.offers.map((offer) => (
              <Pressable
                key={`${offer.kind}-${offer.id}`}
                accessibilityRole="button"
                onPress={() => router.push(offer.destination as any)}
                style={{
                  width,
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: palette.orangeSurface,
                  borderWidth: 1,
                  borderColor: "#f6d6a1",
                }}
              >
                {!!offer.image_url && (
                  <AppImage
                    source={getImageSource(offer.image_url)}
                    style={{ width: "100%", height: 112 }}
                    resizeMode="cover"
                  />
                )}
                <View style={{ padding: 14, gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: palette.orangeInk,
                    }}
                  >
                    {offer.benefit === "percentage"
                      ? `${offer.value}% OFF`
                      : `₦${offer.value.toLocaleString()} OFF`}
                  </Text>
                  <Text style={ui.heading} numberOfLines={2}>
                    {offer.title}
                  </Text>
                  {!!offer.description && (
                    <Text style={ui.muted} numberOfLines={2}>
                      {offer.description}
                    </Text>
                  )}
                  <Text style={{ fontSize: 12, color: palette.orangeInk }}>
                    {offer.audience === "first"
                      ? "First-order offer · "
                      : offer.audience === "returning"
                        ? "Returning customers · "
                        : ""}
                    View offer →
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {!!query.data?.packs.length && (
        <View style={{ gap: 10 }}>
          <View style={[ui.between, { paddingHorizontal: 16 }]}>
            <Text style={ui.heading}>Meal packs</Text>
            <Pressable
              onPress={() => router.push("/packs" as any)}
              style={{ paddingVertical: 8 }}
            >
              <Text style={ui.link}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {query.data.packs.map((pack) => (
              <View key={pack.id} style={{ width: 190 }}>
                <ProductCard item={pack} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
