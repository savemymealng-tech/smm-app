import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton } from "@/components/ui/skeleton";

export function VendorLoadingState() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <Skeleton className="w-full h-64" />
      <View className="p-4">
        <Skeleton className="w-full h-32 rounded-2xl mb-4" />
      </View>
    </View>
  );
}

