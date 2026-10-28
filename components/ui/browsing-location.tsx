import { useState, useRef, useEffect } from "react";
import { useSetAtom } from "jotai";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { BottomSheet } from "./bottom-sheet";
import { Text } from "./text";
import { IconSymbol } from "./icon-symbol";
import { useLocation } from "@/lib/hooks/useLocation";
import { selectBrowsingLocationAtom } from "@/lib/atoms/location";
import apiClient from "@/lib/api/client";

type Area = {
  id: string;
  name: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
};
export function BrowsingLocation() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Area[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const choosingGPS = useRef(false);
  const { location, requestLocation, isLoading, error } = useLocation(false);
  const select = useSetAtom(selectBrowsingLocationAtom);
  useEffect(() => {
    if (
      choosingGPS.current &&
      !isLoading &&
      location?.source === "gps" &&
      !error
    ) {
      choosingGPS.current = false;
      setOpen(false);
    }
  }, [isLoading, location, error]);
  const search = async () => {
    const id = ++request.current;
    setBusy(true);
    setNotice("");
    try {
      const response = await apiClient.get("/locations/browsing", {
        params: { q: query.trim() },
      });
      if (id !== request.current) return;
      const data = response.data.data || [];
      setResults(data);
      if (!data.length)
        setNotice(
          "No areas found. Try a nearby city or a more specific place.",
        );
    } catch {
      if (id === request.current)
        setNotice("Area search is unavailable. Please try again.");
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const choose = async (area: Area) => {
    const id = ++request.current;
    setBusy(true);
    setNotice("");
    try {
      let resolved = area;
      if (area.place_id) {
        const response = await apiClient.get("/locations/browsing/resolve", {
          params: { place_id: area.place_id },
        });
        resolved = response.data.data;
      }
      if (id !== request.current) return;
      select({
        coords:
          Number.isFinite(resolved.latitude) &&
          Number.isFinite(resolved.longitude)
            ? { latitude: resolved.latitude!, longitude: resolved.longitude! }
            : undefined,
        city: resolved.city,
        address: resolved.name,
        source: "manual",
        timestamp: Date.now(),
      });
      setOpen(false);
    } catch {
      if (id === request.current)
        setNotice("Could not select this area. Please try again.");
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change browsing location"
        onPress={() => {
          choosingGPS.current = false;
          setOpen(true);
        }}
        className="flex-row items-center px-4 py-3"
      >
        <IconSymbol name="location.fill" size={18} color="#008236" />
        <View className="flex-1 mx-2">
          <Text className="text-xs text-gray-500">Browse pickup near</Text>
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {location?.address ||
              location?.city ||
              (location?.coords ? "Current location" : "Choose an area")}
          </Text>
        </View>
        <IconSymbol name="chevron.down" size={16} color="#008236" />
      </Pressable>
      <BottomSheet
        visible={open}
        onClose={() => {
          ++request.current;
          setOpen(false);
          setBusy(false);
        }}
        title="Choose your area"
        description="Find products and pickup vendors in another location."
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Pressable
            disabled={isLoading || busy}
            onPress={async () => {
              choosingGPS.current = true;
              await requestLocation();
            }}
            className="rounded-2xl bg-green-50 p-4 mb-4 flex-row items-center"
          >
            <IconSymbol name="location.fill" size={20} color="#008236" />
            <Text className="ml-3 font-semibold text-[#008236]">
              {isLoading ? "Finding your location…" : "Use my current location"}
            </Text>
          </Pressable>
          {error && <Text className="text-sm text-red-700 mb-3">{error}</Text>}
          <View className="flex-row gap-2 mb-3">
            <TextInput
              value={query}
              onChangeText={(text) => {
                ++request.current;
                setQuery(text);
                setResults([]);
                setBusy(false);
              }}
              onSubmitEditing={search}
              placeholder="Search city, area or place"
              returnKeyType="search"
              className="flex-1 rounded-xl border border-gray-200 p-3 text-gray-900"
            />
            <Pressable
              disabled={busy || query.trim().length < 2}
              onPress={search}
              className="rounded-xl bg-[#008236] p-3 justify-center"
            >
              <Text className="text-white font-semibold">Search</Text>
            </Pressable>
          </View>
          {busy && <ActivityIndicator color="#008236" />}
          {!!notice && (
            <Text className="text-sm text-gray-600 py-3">{notice}</Text>
          )}
          <ScrollView keyboardShouldPersistTaps="handled">
            {results.map((area) => (
              <Pressable
                disabled={busy}
                key={area.id}
                onPress={() => choose(area)}
                className="py-4 border-b border-gray-100"
              >
                <Text className="font-semibold text-gray-900">{area.name}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Browse pickup in this area
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text className="text-xs text-gray-500 py-3">
            Pickup only. Your order is collected at the vendor’s location.
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}
