import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useOrders } from "@/lib/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderStatus } from "../types";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: orders, isLoading } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<"all" | OrderStatus>(
    "all"
  );

  const ordersList = orders || [];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "preparing":
        return "text-orange-600 bg-orange-100";
      case "ready":
        return "text-purple-600 bg-purple-100";
      case "on_the_way":
        return "text-indigo-600 bg-indigo-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready";
      case "on_the_way":
        return "On the Way";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredOrders =
    selectedStatus === "all"
      ? ordersList
      : ordersList.filter((order: Order) => order.status === selectedStatus);

  const statusFilters = [
    { key: "all", label: "All", count: ordersList.length },
    {
      key: "on_the_way",
      label: "Active",
      count: ordersList.filter((o: Order) =>
        ["preparing", "ready", "on_the_way"].includes(o.status)
      ).length,
    },
    {
      key: "delivered",
      label: "Delivered",
      count: ordersList.filter((o: Order) => o.status === "delivered").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: ordersList.filter((o: Order) => o.status === "cancelled").length,
    },
  ];

  // Skeleton loader component
  const OrderSkeleton = () => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Skeleton className="w-12 h-12 rounded-full mr-3" />
          <View>
            <Skeleton className="h-5 w-32 rounded mb-2" />
            <Skeleton className="h-4 w-24 rounded" />
          </View>
        </View>
        <Skeleton className="h-6 w-20 rounded-full" />
      </View>
      <View className="flex-row items-center justify-between mb-3">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
      </View>
      <Skeleton className="h-9 w-full rounded mt-2" />
    </View>
  );

  return (
    <View className="flex flex-col flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Order History</Text>
        </View>
      </View>

      {/* Status Filter */}
      <View className="px-4 py-3 flex flex-col bg-white border-b border-gray-200">
        <ScrollView className="flex flex-col" horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {statusFilters.map(({ key, label, count }) => (
              <Pressable
                key={key}
                onPress={() => setSelectedStatus(key as any)}
                className={`px-4 py-2 rounded-full ${
                  selectedStatus === key ? "bg-green-700" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedStatus === key ? "text-white" : "text-gray-700"
                  }`}
                >
                  {label} ({count})
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          {isLoading ? (
            // Skeleton loaders
            <>
              {[...Array(3)].map((_, index) => (
                <OrderSkeleton key={index} />
              ))}
            </>
          ) : filteredOrders.length > 0 ? (
            // Orders list
            filteredOrders.map((order: Order) => (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Image
                      source={
                        order.vendor.logo
                          ? { uri: order.vendor.logo }
                          : require("@/assets/images/default-profile.jpg")
                      }
                      className="w-12 h-12 rounded-full mr-3"
                      resizeMode="cover"
                    />
                    <View>
                      <Text className="font-semibold text-base">
                        {order.vendor.business_name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`px-3 py-1 rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    <Text className="text-xs font-medium">
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600">Order #{order.id}</Text>
                  <Text className="font-bold text-lg">
                    {formatCurrency(order.total)}
                  </Text>
                </View>

                {order.status === "on_the_way" && (
                  <View className="bg-blue-50 rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <IconSymbol
                        name="location.fill"
                        size={16}
                        color="#3b82f6"
                      />
                      <Text className="ml-2 text-blue-700 font-medium">
                        Arriving in 10-15 minutes
                      </Text>
                    </View>
                  </View>
                )}

                {order.status === "preparing" && (
                  <View className="bg-orange-50 rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <IconSymbol name="clock.fill" size={16} color="#ea580c" />
                      <Text className="ml-2 text-orange-700 font-medium">
                        Being prepared
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row space-x-2">
                  {order.status === "delivered" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => router.push(`/vendor/${order.vendorId}`)}
                        className="flex-1"
                      >
                        Order Again
                      </Button>
                      {!order.rating && (
                        <Button
                          size="sm"
                          onPress={() =>
                            router.push(`/order/${order.id}/review`)
                          }
                          className="flex-1"
                        >
                          Rate Order
                        </Button>
                      )}
                    </>
                  )}

                  {["preparing", "ready", "on_the_way"].includes(
                    order.status
                  ) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => router.push(`/order/${order.id}/track`)}
                        className="flex-1"
                      >
                        Track Order
                      </Button>
                    )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push(`/order/${order.id}`)}
                    className="px-4"
                  >
                    <IconSymbol name="chevron.right" size={16} color="#666" />
                  </Button>
                </View>
              </Pressable>
            ))
            ) : (
              // Empty state
              <View className="bg-white rounded-xl p-8 items-center mt-8">
                <IconSymbol name="bag.fill" size={64} color="#d1d5db" />
                <Text className="text-xl font-semibold mt-4 mb-2 text-gray-700">
                No orders found
              </Text>
                  <Text className="text-gray-500 text-center mb-6">
                {selectedStatus === "all"
                      ? "You haven't placed any orders yet. Start exploring our delicious meals!"
                      : `No ${getStatusText(selectedStatus).toLowerCase()} orders found`}
              </Text>
              {selectedStatus === "all" && (
                <Button onPress={() => router.push("/(tabs)")}>
                  Start Shopping
                </Button>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
