import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
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

  // Mock orders for demo
  const mockOrders: Order[] = orders || [
    {
      id: "1",
      userId: "1",
      vendorId: "1",
      vendor: {
        id: "1",
        name: "Burger Palace",
        description: "Best burgers in town",
        logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2340",
        rating: 4.5,
        reviewCount: 120,
        deliveryTime: 30,
        deliveryFee: 2.99,
        minOrder: 15,
        cuisine: ["American"],
        address: "123 Main St",
        latitude: 37.7749,
        longitude: -122.4194,
        isOpen: true,
        isVerified: true,
        featured: true,
      },
      items: [],
      status: "delivered",
      address: {
        id: "1",
        type: "home",
        label: "Home",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        country: "USA",
      },
      paymentMethod: {
        id: "1",
        type: "card",
        last4: "4242",
      },
      subtotal: 24.99,
      deliveryFee: 2.99,
      tax: 2.25,
      discount: 0,
      total: 30.23,
      estimatedDeliveryTime: "2024-01-15T19:30:00Z",
      actualDeliveryTime: "2024-01-15T19:25:00Z",
      rating: 5,
      createdAt: "2024-01-15T18:45:00Z",
      updatedAt: "2024-01-15T19:25:00Z",
    },
    {
      id: "2",
      userId: "1",
      vendorId: "2",
      vendor: {
        id: "2",
        name: "Pizza Corner",
        description: "Authentic Italian pizza",
        logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881",
        rating: 4.8,
        reviewCount: 200,
        deliveryTime: 25,
        deliveryFee: 1.99,
        minOrder: 12,
        cuisine: ["Italian"],
        address: "456 Oak St",
        latitude: 37.7849,
        longitude: -122.4094,
        isOpen: true,
        isVerified: true,
        featured: false,
      },
      items: [],
      status: "on_the_way",
      address: {
        id: "1",
        type: "home",
        label: "Home",
        street: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102",
        country: "USA",
      },
      paymentMethod: {
        id: "1",
        type: "card",
        last4: "4242",
      },
      subtotal: 18.99,
      deliveryFee: 1.99,
      tax: 1.89,
      discount: 2.0,
      total: 20.87,
      estimatedDeliveryTime: "2024-01-16T20:15:00Z",
      createdAt: "2024-01-16T19:30:00Z",
      updatedAt: "2024-01-16T20:00:00Z",
    },
    {
      id: "3",
      userId: "1",
      vendorId: "3",
      vendor: {
        id: "3",
        name: "Sushi Express",
        description: "Fresh sushi daily",
        logo: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=2340",
        rating: 4.6,
        reviewCount: 150,
        deliveryTime: 35,
        deliveryFee: 3.99,
        minOrder: 20,
        cuisine: ["Japanese"],
        address: "789 Pine St",
        latitude: 37.7949,
        longitude: -122.3994,
        isOpen: true,
        isVerified: true,
        featured: false,
      },
      items: [],
      status: "preparing",
      address: {
        id: "2",
        type: "work",
        label: "Office",
        street: "456 Business Ave",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "USA",
      },
      paymentMethod: {
        id: "2",
        type: "apple_pay",
      },
      subtotal: 32.99,
      deliveryFee: 3.99,
      tax: 3.33,
      discount: 0,
      total: 40.31,
      estimatedDeliveryTime: "2024-01-16T21:00:00Z",
      createdAt: "2024-01-16T20:15:00Z",
      updatedAt: "2024-01-16T20:20:00Z",
    },
  ];

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
      ? mockOrders
      : mockOrders.filter((order) => order.status === selectedStatus);

  const statusFilters = [
    { key: "all", label: "All", count: mockOrders.length },
    {
      key: "on_the_way",
      label: "Active",
      count: mockOrders.filter((o) =>
        ["preparing", "ready", "on_the_way"].includes(o.status)
      ).length,
    },
    {
      key: "delivered",
      label: "Delivered",
      count: mockOrders.filter((o) => o.status === "delivered").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: mockOrders.filter((o) => o.status === "cancelled").length,
    },
  ];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
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
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-3">
            {statusFilters.map(({ key, label, count }) => (
              <Pressable
                key={key}
                onPress={() => setSelectedStatus(key as any)}
                className={`px-4 py-2 rounded-full ${
                  selectedStatus === key ? "bg-blue-600" : "bg-gray-100"
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
          {filteredOrders.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/order/${order.id}`)}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: order.vendor.logo }}
                    className="w-12 h-12 rounded-full mr-3"
                    resizeMode="cover"
                  />
                  <View>
                    <Text className="font-semibold text-base">
                      {order.vendor.name}
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
                        onPress={() => router.push(`/order/${order.id}/review`)}
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
          ))}

          {filteredOrders.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center">
              <IconSymbol name="calendar" size={48} color="#ccc" />
              <Text className="text-xl font-semibold mt-4 mb-2">
                No orders found
              </Text>
              <Text className="text-gray-500 text-center mb-4">
                {selectedStatus === "all"
                  ? "You haven't placed any orders yet"
                  : `No ${selectedStatus} orders found`}
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
