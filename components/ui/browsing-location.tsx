import { useState, useRef, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { BottomSheet } from './bottom-sheet';
import { Text } from './text';
import { IconSymbol } from './icon-symbol';
import { useLocation } from '@/lib/hooks/useLocation';
import { selectBrowsingLocationAtom } from '@/lib/atoms/location';
import apiClient from '@/lib/api/client';

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
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query.trim(), 450);
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const resolution = useRef<AbortController | null>(null);
  const choosingGPS = useRef(false);
  const { location, requestLocation, isLoading, error } = useLocation(false);
  const select = useSetAtom(selectBrowsingLocationAtom);
  const settled = debouncedQuery === query.trim();
  const search = useQuery({
    queryKey: ['browsing-area-search', debouncedQuery],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get('/locations/browsing', {
        params: { q: debouncedQuery },
        signal,
      });
      return (response.data.data || []) as Area[];
    },
    enabled:
      open && settled && debouncedQuery.length >= 2 && !resolving && !isLoading,
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const searching =
    open &&
    !resolving &&
    query.trim().length >= 2 &&
    (!settled || search.isFetching);
  const results =
    settled && !searching && !search.isError ? search.data || [] : [];
  function close() {
    ++request.current;
    resolution.current?.abort();
    Keyboard.dismiss();
    setOpen(false);
    setResolving(false);
    choosingGPS.current = false;
  }
  useEffect(
    () => () => {
      ++request.current;
      resolution.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (
      choosingGPS.current &&
      !isLoading &&
      location?.source === 'gps' &&
      !error
    ) {
      choosingGPS.current = false;
      Keyboard.dismiss();
      setOpen(false);
    }
  }, [isLoading, location, error]);
  async function choose(area: Area) {
    const id = ++request.current;
    resolution.current?.abort();
    const controller = new AbortController();
    resolution.current = controller;
    setResolving(true);
    setNotice('');
    Keyboard.dismiss();
    try {
      let resolved = area;
      if (area.place_id) {
        const response = await apiClient.get('/locations/browsing/resolve', {
          params: { place_id: area.place_id },
          signal: controller.signal,
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
        source: 'manual',
        timestamp: Date.now(),
      });
      setOpen(false);
    } catch {
      if (id === request.current && !controller.signal.aborted)
        setNotice('Could not select this area. Please try again.');
    } finally {
      if (id === request.current) setResolving(false);
    }
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change browsing location"
        onPress={() => {
          choosingGPS.current = false;
          setNotice('');
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
              (location?.coords ? 'Current location' : 'Choose an area')}
          </Text>
        </View>
        <IconSymbol name="chevron.down" size={16} color="#008236" />
      </Pressable>
      <BottomSheet
        visible={open}
        onClose={close}
        title="Choose your area"
        description="Find products and pickup vendors in another location."
      >
        <View style={styles.content}>
          <View style={styles.inputRow}>
            <IconSymbol name="magnifyingglass" size={18} color="#66736c" />
            <TextInput
              accessibilityLabel="Search city, area or place"
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setNotice('');
              }}
              editable={!resolving && !isLoading}
              onSubmitEditing={() => Keyboard.dismiss()}
              placeholder="Search city, area or place"
              placeholderTextColor="#66736c"
              returnKeyType="search"
              autoCorrect={false}
              maxLength={150}
              style={styles.input}
            />
            {searching ? (
              <ActivityIndicator color="#008236" size="small" />
            ) : query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear area search"
                disabled={resolving}
                onPress={() => {
                  setQuery('');
                  setNotice('');
                }}
                style={styles.clear}
              >
                <Text style={{ fontSize: 20, color: '#66736c' }}>×</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            disabled={isLoading || resolving}
            accessibilityRole="button"
            onPress={async () => {
              Keyboard.dismiss();
              choosingGPS.current = true;
              await requestLocation();
            }}
            style={styles.gps}
          >
            <IconSymbol name="location.fill" size={18} color="#008236" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#008236' }}>
              {isLoading ? 'Finding your location…' : 'Use my current location'}
            </Text>
          </Pressable>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!notice && (
            <Text accessibilityRole="alert" style={styles.error}>
              {notice}
            </Text>
          )}
          {resolving && <ActivityIndicator color="#008236" />}
          {settled && query.trim().length >= 2 && search.isError && (
            <View style={{ gap: 4 }}>
              <Text accessibilityRole="alert" style={styles.error}>
                Area search is unavailable. Please try again.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void search.refetch()}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: '#008236', fontWeight: '600' }}>
                  Try again
                </Text>
              </Pressable>
            </View>
          )}
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {query.trim().length < 2 ? (
              <Text style={styles.hint}>
                {query.trim().length
                  ? 'Enter at least 2 characters.'
                  : 'Start typing a city, area or place.'}
              </Text>
            ) : searching ? (
              <Text style={styles.hint}>Searching areas…</Text>
            ) : !resolving && !search.isError && !results.length ? (
              <Text style={styles.hint}>
                No areas found. Try a nearby city or a more specific place.
              </Text>
            ) : null}
            {results.map((area) => (
              <Pressable
                accessibilityRole="button"
                disabled={resolving || isLoading}
                key={area.id}
                onPress={() => void choose(area)}
                style={styles.result}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#17251d' }}
                >
                  {area.name}
                </Text>
                <Text style={styles.hint}>Browse pickup in this area</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.footer}>
            Pickup only. Collect your order at the vendor’s location.
          </Text>
        </View>
      </BottomSheet>
    </>
  );
}
const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0, paddingHorizontal: 20, gap: 8 },
  inputRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dce4df',
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#17251d',
  },
  clear: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gps: {
    minHeight: 44,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  result: {
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0ee',
  },
  hint: { fontSize: 12, lineHeight: 18, color: '#66736c' },
  error: { fontSize: 13, lineHeight: 19, color: '#b42318' },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    color: '#66736c',
    paddingVertical: 4,
  },
});
