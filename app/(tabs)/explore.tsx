import { SlidersHorizontal } from 'lucide-react-native';
import { formatMoney } from '@/lib/order-display';
import { Action, Message, palette } from '@/components/ui/screen-kit';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCategories } from '@/lib/hooks/use-categories';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAtom } from 'jotai';
import {
  ActivityIndicator,
  ScrollView,
  Keyboard,
  FlatList,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from 'use-debounce';
import { Text } from '@/components/ui/text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { BrowsingLocation } from '@/components/ui/browsing-location';
import { FilterPanel } from '@/components/explore/FilterPanel';
import { ProductCard } from '@/components/explore/ProductCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBrowseMealsInfinite } from '@/lib/hooks';
import { useLocation } from '@/lib/hooks/useLocation';
import {
  locationRadiusAtom,
  useLocationFilterAtom,
} from '@/lib/atoms/locationFilter';
import type { BrowseMealsParams, Meal } from '@/types/api';

const empty = {
  category: null as string | null,
  rating: null as number | null,
  min: null as number | null,
  max: null as number | null,
  sort: 'created_at',
};
export default function ExploreScreen() {
  const route = useLocalSearchParams<{
    q?: string;
    category?: string;
    nearby_vendors?: string;
    all_vendors?: string;
    scope?: string;
    reset?: string;
  }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [sceneHeight, setSceneHeight] = useState(0);
  // The navigator normally reserves bar space; only add the portion overlapping the scene.
  const bottomClearance =
    16 +
    (sceneHeight
      ? Math.max(0, tabBarHeight - Math.max(0, windowHeight - sceneHeight))
      : 0);
  const { location } = useLocation();
  const listRef = useRef<FlatList<Meal>>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState(route.q || '');
  const [search] = useDebounce(query.trim(), 400);
  const [filters, setFilters] = useState({
    ...empty,
    category: route.category || null,
  });
  const [draft, setDraft] = useState(filters);
  const [near, setNear] = useAtom(useLocationFilterAtom);
  const [radius, setRadius] = useAtom(locationRadiusAtom);
  const [draftNear, setDraftNear] = useState(near);
  const [draftRadius, setDraftRadius] = useState(radius);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const { data: categories } = useCategories();
  useEffect(() => {
    setQuery(route.q || '');
  }, [route.q]);
  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: route.category || null }));
  }, [route.category]);
  useEffect(() => {
    if (route.nearby_vendors === 'true' || route.all_vendors === 'true')
      router.replace(
        `/vendors?filter=${route.nearby_vendors === 'true' ? 'nearby' : 'all'}`,
      );
  }, [route.nearby_vendors, route.all_vendors]);
  useEffect(() => {
    if (route.scope) setNear(route.scope === 'area');
    if (route.reset) {
      setQuery(route.q || '');
      setFilters({ ...empty, category: route.category || null });
    }
  }, [route.scope, route.reset, route.q, route.category, setNear]);
  const scoped = near && !!(location?.coords || location?.city);
  const params = useMemo(
    () =>
      ({
        search,
        category_id: filters.category ? Number(filters.category) : undefined,
        vendor_rating_min: filters.rating ?? undefined,
        min_price: filters.min ?? undefined,
        max_price: filters.max ?? undefined,
        ...(scoped
          ? location?.coords
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                radius,
              }
            : { city: location?.city }
          : {}),
        sort_by:
          filters.sort === 'distance' && (!location?.coords || !scoped)
            ? 'created_at'
            : filters.sort,
      }) as BrowseMealsParams,
    [search, filters, scoped, location, radius],
  );
  const result = useBrowseMealsInfinite(params);
  const scopeKey = JSON.stringify(params);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [scopeKey]);
  const activeCount =
    Number(!!filters.category) +
    Number(filters.rating !== null) +
    Number(filters.min !== null || filters.max !== null);
  const sortOptions = [
    ['Newest', 'created_at'],
    ['Price: low to high', 'price_asc'],
    ['Price: high to low', 'price_desc'],
    ...(scoped && location?.coords ? [['Nearest first', 'distance']] : []),
  ];
  const sortLabel =
    sortOptions.find(([, value]) => value === params.sort_by)?.[0] || 'Newest';
  const resetProducts = () => {
    setFilters({ ...empty });
    setQuery('');
  };
  const products = useMemo(
    () => [
      ...new Map(
        (
          result.data?.pages
            .flatMap((page) => page.data)
            .filter((item): item is Meal => !!item) || []
        ).map((item) => [item.id, item]),
      ).values(),
    ],
    [result.data],
  );
  const total = result.data?.pages[0]?.total ?? 0;
  const chips = [
    filters.category && {
      label:
        categories?.find((c) => String(c.id) === filters.category)?.name ||
        'Category',
      clear: () => setFilters((f) => ({ ...f, category: null })),
    },
    filters.rating && {
      label: `Vendor ${filters.rating}+ stars`,
      clear: () => setFilters((f) => ({ ...f, rating: null })),
    },
    (filters.min !== null || filters.max !== null) && {
      label:
        filters.min !== null && filters.max !== null
          ? `${formatMoney(filters.min)}–${formatMoney(filters.max)}`
          : filters.min !== null
            ? `From ${formatMoney(filters.min)}`
            : `Up to ${formatMoney(filters.max!)}`,
      clear: () => setFilters((f) => ({ ...f, min: null, max: null })),
    },
    scoped && {
      label: location?.coords ? `Within ${radius} km` : location?.city,
      clear: () => setNear(false),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  return (
    <View
      className="flex-1 bg-gray-50"
      style={{ flex: 1, paddingTop: insets.top }}
      onLayout={(event) => setSceneHeight(event.nativeEvent.layout.height)}
    >
      <View className="bg-white pb-3">
        <BrowsingLocation onSelected={() => setNear(true)} />
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: '#f2f5f3',
              paddingHorizontal: 10,
            }}
          >
            <IconSymbol name="magnifyingglass" size={18} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
              autoCorrect={false}
              maxLength={150}
              style={{
                flex: 1,
                minWidth: 0,
                height: 44,
                paddingHorizontal: 8,
                paddingVertical: 10,
                fontSize: 14,
                color: palette.ink,
              }}
            />
            {query.length > 0 && (
              <Pressable
                accessibilityLabel="Clear search"
                onPress={() => setQuery('')}
              >
                <Text className="text-gray-500">✕</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityLabel="Open product filters"
            onPress={() => {
              setDraft(filters);
              setDraftNear(near && !!location);
              setDraftRadius(radius);
              setNotice('');
              setOpen(true);
            }}
            accessibilityRole="button"
            style={{
              backgroundColor: palette.green,
              borderRadius: 12,
              paddingHorizontal: 12,
              flexDirection: 'row',
              gap: 6,
              flexShrink: 0,
              minWidth: 44,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={18} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
              Filters
            </Text>
            {activeCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: palette.green,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: palette.green,
                  }}
                >
                  {activeCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        {chips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 8,
              paddingTop: 10,
            }}
          >
            {chips.map((chip) => (
              <Pressable
                key={chip.label}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${chip.label} filter`}
                onPress={chip.clear}
                style={{
                  minHeight: 36,
                  justifyContent: 'center',
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: '#edf7f0',
                }}
              >
                <Text style={{ fontSize: 12, color: palette.green }}>
                  {chip.label} ×
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '600', color: palette.ink }}
            >
              {result.isLoading
                ? 'Finding products…'
                : `${total} ${total === 1 ? 'product' : 'products'}`}
            </Text>
            <Text style={{ fontSize: 11, color: palette.muted, marginTop: 2 }}>
              {scoped
                ? location?.coords
                  ? `Selected area · ${radius} km radius`
                  : `In ${location?.city}`
                : 'Across all areas'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sort products"
            onPress={() => {
              Keyboard.dismiss();
              setSortOpen(true);
            }}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text
              style={{ fontSize: 12, fontWeight: '600', color: palette.green }}
            >
              Sort: {sortLabel}⌄
            </Text>
          </Pressable>
        </View>
        {!scoped && !!location && (
          <Pressable
            onPress={() => setNear(true)}
            style={{ paddingHorizontal: 16, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, color: palette.green }}>
              Show products in {location.city || 'my selected area'}
            </Text>
          </Pressable>
        )}
      </View>
      <FlatList
        ref={listRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomClearance }}
        renderItem={({ item }) => (
          <View style={{ width: Math.max(0, (windowWidth - 44) / 2) }}>
            <ProductCard
              item={item}
              userLocation={scoped ? location?.coords : undefined}
            />
          </View>
        )}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void result.refetch().finally(() => setRefreshing(false));
        }}
        onEndReached={() => {
          if (
            result.hasNextPage &&
            !result.isFetchingNextPage &&
            !result.isError
          )
            void result.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          result.isLoading ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[0, 1].map((i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 290,
                    borderRadius: 16,
                    backgroundColor: '#e5ece7',
                  }}
                />
              ))}
            </View>
          ) : result.isError ? (
            <Message
              title="Could not load products"
              body="Check your connection and try again."
              onRetry={() => void result.refetch()}
            />
          ) : (
            <View style={{ gap: 12, paddingVertical: 24 }}>
              <Message
                title="No products found"
                body={
                  query
                    ? `We couldn't find a match for “${query}”. Try a different name or fewer filters.`
                    : 'Try another area or adjust your filters.'
                }
              />
              {(activeCount > 0 || query.length > 0) && (
                <Action
                  secondary
                  label="Clear search & filters"
                  onPress={resetProducts}
                />
              )}
              {scoped && (
                <Action
                  secondary
                  label="Explore all areas"
                  onPress={() => setNear(false)}
                />
              )}
            </View>
          )
        }
        ListFooterComponent={
          result.isFetchingNextPage ? (
            <ActivityIndicator color="#008236" />
          ) : result.isError && products.length > 0 ? (
            <Pressable
              onPress={() => {
                void (result.isFetchNextPageError
                  ? result.fetchNextPage()
                  : result.refetch());
              }}
              className="p-4"
            >
              <Text className="text-center text-[#008236]">
                Unable to load products. Tap to retry.
              </Text>
            </Pressable>
          ) : null
        }
      />
      <BottomSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        title="Sort products"
        preferredHeight={360}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {sortOptions.map(([label, value]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: params.sort_by === value }}
              onPress={() => {
                setFilters((f) => ({ ...f, sort: value }));
                setSortOpen(false);
              }}
              style={{
                minHeight: 48,
                borderWidth: 1,
                borderColor:
                  params.sort_by === value ? palette.green : palette.border,
                borderRadius: 10,
                paddingHorizontal: 14,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: params.sort_by === value ? palette.green : palette.ink,
                }}
              >
                {label}
                {params.sort_by === value ? ' ✓' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Filter products"
        description="Choose what you’d like to find."
      >
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <FilterPanel
            selectedCategory={draft.category}
            onCategoryChange={(category) =>
              setDraft((f) => ({ ...f, category }))
            }
            minRating={draft.rating}
            onRatingChange={(rating) => setDraft((f) => ({ ...f, rating }))}
            categories={categories?.map((c) => ({
              id: String(c.id),
              name: c.name,
              slug: c.name,
            }))}
            minPrice={draft.min}
            maxPrice={draft.max}
            onPriceChange={(min, max) => setDraft((f) => ({ ...f, min, max }))}
            useLocationFilter={draftNear}
            onLocationFilterChange={setDraftNear}
            locationRadius={draftRadius}
            onRadiusChange={setDraftRadius}
            currentAddress={location?.address}
            hasCoordinates={!!location?.coords}
            sort={draft.sort}
            onSortChange={(sort) => setDraft((f) => ({ ...f, sort }))}
            allowDistanceSort={!!location?.coords && draftNear}
          />
          {!!notice && <Text className="text-red-700 text-sm">{notice}</Text>}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingTop: 10,
              paddingBottom: insets.bottom + 10,
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              backgroundColor: '#fff',
            }}
          >
            <Pressable
              onPress={() => {
                setDraft(empty);
                setDraftNear(!!location);
                setDraftRadius(10);
                setNotice('');
              }}
              accessibilityRole="button"
              style={{
                width: 84,
                minHeight: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#d1d5db',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 10,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}
              >
                Reset
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (
                  [draft.min, draft.max].some(
                    (x) => x !== null && (!Number.isFinite(x) || x < 0),
                  ) ||
                  (draft.min !== null &&
                    draft.max !== null &&
                    draft.min > draft.max)
                ) {
                  setNotice('Enter a valid price range.');
                  return;
                }
                if (draftNear && !location) {
                  setNotice(
                    'Choose an area above before filtering by location.',
                  );
                  return;
                }
                setFilters({
                  ...draft,
                  sort:
                    draft.sort === 'distance' &&
                    (!draftNear || !location?.coords)
                      ? 'created_at'
                      : draft.sort,
                });
                setNear(draftNear);
                setRadius(draftRadius);
                setOpen(false);
              }}
              accessibilityRole="button"
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                backgroundColor: '#008236',
                paddingHorizontal: 16,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                Apply filters
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
