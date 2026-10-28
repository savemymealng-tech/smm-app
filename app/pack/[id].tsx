import { useQuery } from "@tanstack/react-query";
import { Redirect, useLocalSearchParams } from "expo-router";
import api from "@/lib/api/client";
import { Screen, Card, ui } from "@/components/ui/screen-kit";
import { Text, View, ActivityIndicator } from "react-native";
export default function PackLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["pack", id],
    queryFn: async () => (await api.get(`/deals/packs/${id}`)).data.data,
    enabled: Boolean(id),
  });
  if (query.data?.product_id)
    return <Redirect href={`/product/${query.data.product_id}` as any} />;
  return (
    <Screen title="Meal pack">
      <View style={{ padding: 16 }}>
        <Card>
          {query.isLoading ? (
            <ActivityIndicator />
          ) : (
            <Text style={ui.body}>This pack is currently unavailable.</Text>
          )}
        </Card>
      </View>
    </Screen>
  );
}
