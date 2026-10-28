import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCategories } from '@/lib/hooks/use-categories';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAtom } from 'jotai';
import {
  ActivityIndicator,
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
  }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { height: windowHeight } = useWindowDimensions();
  const [sceneHeight, setSceneHeight] = useState(0);
  // The navigator normally reserves bar space; only add the portion overlapping the scene.
  const bottomClearance =
    16 +
    (sceneHeight
      ? Math.max(0, tabBarHeight - Math.max(0, windowHeight - sceneHeight))
      : 0);
  const { location } = useLocation();
  const [query, setQuery] = useState(route.q || '');
  const [search] = useDebounce(query, 400);
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
          filters.sort === 'distance' && !location?.coords
            ? 'created_at'
            : filters.sort,
      }) as BrowseMealsParams,
    [search, filters, scoped, location, radius],
  );
  const result = useBrowseMealsInfinite(params);
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
      label: `${filters.rating}+ stars`,
      clear: () => setFilters((f) => ({ ...f, rating: null })),
    },
    (filters.min !== null || filters.max !== null) && {
      label: 'Price range',
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
        <BrowsingLocation />
        <View className="px-4 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center rounded-2xl bg-gray-100 px-3">
            <IconSymbol name="magnifyingglass" size={18} color="#6b7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products"
              returnKeyType="search"
              className="flex-1 p-3 text-gray-900"
            />
            <Pressable
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
            >
              <Text className="text-gray-500">{query ? '✕' : ''}</Text>
            </Pressable>
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
            className="bg-[#008236] rounded-2xl p-3"
          >
            <IconSymbol name="slider.horizontal.3" size={22} color="white" />
          </Pressable>
        </View>
        <View className="flex-row flex-wrap px-4 mt-2 gap-2">
          {chips.map((chip) => (
            <Pressable
              key={chip.label}
              onPress={chip.clear}
              className="bg-green-50 rounded-full px-3 py-2"
            >
              <Text className="text-xs text-[#008236]">{chip.label} ×</Text>
            </Pressable>
          ))}
        </View>
        <Text className="px-4 mt-2 text-sm text-gray-500">
          {result.isLoading ? 'Finding products…' : `${total} products`}
          {!scoped ? ' · All areas' : ''}
        </Text>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomClearance }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '50%' }}>
            <ProductCard
              item={item}
              userLocation={scoped ? location?.coords : undefined}
            />
          </View>
        )}
        refreshing={result.isRefetching && !result.isFetchingNextPage}
        onRefresh={() => {
          void result.refetch();
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
          <View className="items-center py-16">
            <Text className="text-lg font-semibold">
              {result.isError
                ? 'Could not load products'
                : result.isLoading
                  ? 'Loading products…'
                  : 'No products found'}
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              {result.isError
                ? 'Check your connection and try again.'
                : 'Try another area, search or fewer filters.'}
            </Text>
            {result.isError && (
              <Pressable
                onPress={() => {
                  void result.refetch();
                }}
                className="p-4"
              >
                <Text className="text-[#008236] font-semibold">Try again</Text>
              </Pressable>
            )}
          </View>
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
                setDraftNear(false);
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
                setFilters(draft);
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
