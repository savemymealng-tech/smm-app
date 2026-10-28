import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Screen, Card, Action, palette, ui } from "@/components/ui/screen-kit";
import { ProductCard } from "@/components/product/ProductCard";
import { BrowsingLocation } from "@/components/ui/browsing-location";
import { useDiscoveryArea } from "@/lib/hooks/use-discovery";
import { discoveryApi } from "@/lib/api/discovery";
import { useAtom, useAtomValue } from "jotai";
import { selectedOfferCodeAtom } from "@/lib/atoms/offer";
import { authAtom } from "@/lib/atoms/auth";
export default function OfferCollection({
  kind,
  id,
}: {
  kind: "campaign" | "deal" | "packs";
  id?: string;
}) {
  const area = useDiscoveryArea(),
    auth = useAtomValue(authAtom),
    [, setCode] = useAtom(selectedOfferCodeAtom);
  const [chosen, setChosen] = useState(false);
  const width = (useWindowDimensions().width - 44) / 2;
  const query = useInfiniteQuery({
    queryKey: ["offer-collection", kind, id, area, auth.user?.id],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      kind === "packs"
        ? {
            offer: null,
            products: await discoveryApi.packs({ ...area, page: pageParam }),
          }
        : discoveryApi.collection(kind, id || "", { ...area, page: pageParam }),
    getNextPageParam: (last) =>
      last.products.page < last.products.totalPages
        ? last.products.page + 1
        : undefined,
    enabled: !auth.isLoading,
    staleTime: 60_000,
  });
  const offer = query.data?.pages[0].offer;
  const rows = query.data?.pages.flatMap((page) => page.products.data) || [];
  return (
    <Screen title={kind === "packs" ? "Meal packs" : "Offer details"}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <BrowsingLocation />
            {offer && (
              <Card>
                <Text style={ui.title}>{offer.title}</Text>
                <Text style={ui.body}>{offer.description}</Text>
                <Text style={ui.muted}>
                  Ends {new Date(offer.ends_at).toLocaleDateString()} ·
                  Eligibility confirmed at checkout
                </Text>
                {Boolean(offer.minimum_spend_kobo) && (
                  <Text style={ui.muted}>
                    Minimum eligible spend: ₦
                    {((offer.minimum_spend_kobo || 0) / 100).toLocaleString()}
                  </Text>
                )}
                {Boolean(offer.maximum_discount_kobo) && (
                  <Text style={ui.muted}>
                    Maximum saving: ₦
                    {(
                      (offer.maximum_discount_kobo || 0) / 100
                    ).toLocaleString()}
                  </Text>
                )}
                {!!offer.terms && <Text style={ui.muted}>{offer.terms}</Text>}
                {!!offer.code && (
                  <>
                    <Text style={ui.heading}>Code: {offer.code}</Text>
                    <Action
                      tone="accent"
                      label={
                        chosen
                          ? "Offer selected for checkout"
                          : "Use this offer"
                      }
                      onPress={() => {
                        setCode(offer.code || "");
                        setChosen(true);
                      }}
                    />
                  </>
                )}
                {!offer.code && (
                  <Text style={ui.muted}>
                    Available benefits are checked automatically at checkout.
                  </Text>
                )}
                {offer.requires_sign_in && (
                  <Action
                    secondary
                    label="Sign in to check eligibility"
                    onPress={() =>
                      router.push({
                        pathname: "/login",
                        params: { returnTo: offer.destination },
                      })
                    }
                  />
                )}
              </Card>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width }}>
            <ProductCard item={item} />
          </View>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={palette.green} />
          ) : (
            <Card>
              <Text style={ui.heading}>
                {query.isError
                  ? "This offer could not load"
                  : "No items available in this area"}
              </Text>
              <Text style={ui.muted}>
                {query.isError
                  ? "The offer may have ended or no longer apply to your account."
                  : "Choose another browsing location or check back later."}
              </Text>
              <Action
                secondary
                label="Try again"
                onPress={() => void query.refetch()}
              />
            </Card>
          )
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => void query.refetch()}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={palette.green} />
          ) : null
        }
      />
    </Screen>
  );
}
