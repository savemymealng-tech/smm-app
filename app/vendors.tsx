import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from 'use-debounce';
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react-native';
import { BrowsingLocation } from '@/components/ui/browsing-location';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { VendorCard } from '@/components/vendor/VendorCard';
import { Action, Message, palette, ui } from '@/components/ui/screen-kit';
import { locationRadiusAtom } from '@/lib/atoms/locationFilter';
import {
  useAllVendors,
  useFeaturedVendors,
  useNearbyVendors,
} from '@/lib/hooks';
import { useLocation } from '@/lib/hooks/useLocation';
type Filter = 'all' | 'featured' | 'nearby';
const filterValues: Filter[] = ['all', 'featured', 'nearby'];
export default function VendorsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [search] = useDebounce(query.trim(), 350);
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useAtom(locationRadiusAtom);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [draft, setDraft] = useState(String(radius));
  const [notice, setNotice] = useState('');
  const {
    location,
    requestLocation,
    isLoading: gpsLoading,
    error: locationError,
  } = useLocation();
  const hasArea = !!(location?.city || location?.coords);
  const all = useAllVendors(100),
    featured = useFeaturedVendors(),
    nearby = useNearbyVendors(
      location?.coords?.latitude ?? null,
      location?.coords?.longitude ?? null,
      radius,
      100,
    );
  const active =
    filter === 'all' ? all : filter === 'featured' ? featured : nearby;
  const vendors = useMemo(() => {
    const items = active.data || [];
    return search
      ? items.filter((v) =>
          (v.business_name || '')
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase()),
        )
      : items;
  }, [active.data, search]);
  useEffect(() => {
    if (filterValues.includes(params.filter as Filter))
      setFilter(params.filter as Filter);
  }, [params.filter]);
  async function refresh() {
    setRefreshing(true);
    try {
      await active.refetch();
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}
    >
      <View
        style={{
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <View
          style={{
            minHeight: 56,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(tabs)')
            }
            style={{
              width: 44,
              height: 44,
              marginLeft: -8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={24} color={palette.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={ui.title}>Vendors</Text>
            <Text
              style={{ fontSize: 12, lineHeight: 18, color: palette.muted }}
            >
              Find your next pickup
            </Text>
          </View>
        </View>
        <BrowsingLocation />
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            minHeight: 44,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#f2f5f3',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Search size={18} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search vendors"
            placeholder="Search vendors"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => Keyboard.dismiss()}
            autoCorrect={false}
            returnKeyType="search"
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              fontSize: 14,
              color: palette.ink,
            }}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear vendor search"
              onPress={() => setQuery('')}
              style={{
                width: 36,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={17} color={palette.muted} />
            </Pressable>
          )}
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: 'row',
            gap: 8,
            paddingBottom: 10,
          }}
        >
          {filterValues.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === value }}
              onPress={() => setFilter(value)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: filter === value ? palette.green : palette.border,
                backgroundColor:
                  filter === value ? palette.greenSurface : '#fff',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              {value === 'featured' && (
                <Sparkles size={13} color={palette.orangeInk} />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: filter === value ? palette.green : palette.muted,
                }}
              >
                {value === 'all'
                  ? 'All'
                  : value === 'featured'
                    ? 'Featured'
                    : 'Nearby'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: palette.muted }}>
              {filter === 'nearby' && !hasArea
                ? 'Choose an area to find vendors'
                : active.isLoading
                  ? 'Finding vendors…'
                  : `Showing ${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'}`}
            </Text>
            <Text
              style={{ fontSize: 11, lineHeight: 17, color: palette.muted }}
            >
              {location?.city
                ? `In ${location.city}`
                : location?.coords
                  ? 'Around your selected area'
                  : 'Across all areas'}
            </Text>
          </View>
          {filter === 'nearby' && !!location?.coords && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change vendor search radius"
              onPress={() => {
                setDraft(String(radius));
                setNotice('');
                setRadiusOpen(true);
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: 10,
                gap: 5,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: palette.greenSurface,
              }}
            >
              <SlidersHorizontal size={15} color={palette.green} />
              <Text style={ui.link}>{radius} km</Text>
            </Pressable>
          )}
        </View>
      </View>
      {filter === 'nearby' && !hasArea ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Message
            title="Choose where to browse"
            body="Select a city or area above to find pickup vendors."
          />
          {!!locationError && <Text style={ui.muted}>{locationError}</Text>}
          <Action
            secondary
            label="Use my current location"
            busy={gpsLoading}
            onPress={() => void requestLocation()}
          />
        </View>
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(24, insets.bottom + 16),
            gap: 14,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={palette.green}
            />
          }
          renderItem={({ item }) => (
            <VendorCard
              item={item}
              variant="list"
              userLocation={location?.coords}
            />
          )}
          ListHeaderComponent={
            active.isError && vendors.length > 0 ? (
              <Message
                title="Unable to refresh vendors"
                body="Showing your previous results. Pull down to retry."
                onRetry={() => void active.refetch()}
              />
            ) : null
          }
          ListEmptyComponent={
            active.isLoading ? (
              <View style={{ gap: 14 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      height: 174,
                      borderRadius: 18,
                      backgroundColor: '#e6ede8',
                    }}
                  />
                ))}
              </View>
            ) : active.isError ? (
              <Message
                title="Unable to load vendors"
                body="Check your connection and try again."
                onRetry={() => void active.refetch()}
              />
            ) : (
              <View style={{ gap: 12 }}>
                <Message
                  title={
                    search
                      ? 'No matching vendors'
                      : filter === 'featured'
                        ? 'No featured vendors here yet'
                        : 'No vendors found in this area'
                  }
                  body={
                    search
                      ? 'Try another vendor name or clear your search.'
                      : 'Choose another area above or browse a different vendor category.'
                  }
                />
                {search.length > 0 && (
                  <Action
                    secondary
                    label="Clear search"
                    onPress={() => setQuery('')}
                  />
                )}
              </View>
            )
          }
        />
      )}
      <BottomSheet
        visible={radiusOpen}
        onClose={() => setRadiusOpen(false)}
        title="Vendor search radius"
        preferredHeight={380}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        >
          <Text style={ui.muted}>
            Find vendors within this distance of your selected location.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {[5, 10, 15, 20, 50].map((km) => (
              <Pressable
                key={km}
                onPress={() => setDraft(String(km))}
                style={{
                  minHeight: 40,
                  paddingHorizontal: 12,
                  borderRadius: 9,
                  borderWidth: 1,
                  borderColor:
                    draft === String(km) ? palette.green : palette.border,
                  justifyContent: 'center',
                  backgroundColor:
                    draft === String(km) ? palette.greenSurface : '#fff',
                }}
              >
                <Text style={{ fontSize: 13, color: palette.green }}>
                  {km} km
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            accessibilityLabel="Custom vendor radius in kilometres"
            placeholder="Custom radius (1–200 km)"
            keyboardType="number-pad"
            value={draft}
            onChangeText={setDraft}
            maxLength={3}
            style={ui.input}
          />
          {!!notice && (
            <Text
              accessibilityRole="alert"
              style={{ fontSize: 13, color: palette.red }}
            >
              {notice}
            </Text>
          )}
          <Action
            label="Apply radius"
            onPress={() => {
              const value = Number(draft);
              if (!Number.isSafeInteger(value) || value < 1 || value > 200) {
                setNotice('Enter a whole number between 1 and 200 km.');
                return;
              }
              setRadius(value);
              setRadiusOpen(false);
            }}
          />
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
