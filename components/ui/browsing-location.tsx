import { useState, useRef, useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
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
import { authAtom } from '@/lib/atoms/auth';
import {
  type Area,
  type RecentArea,
  cleanRecent,
  filterRecent,
  loadRecentAreas,
  saveRecentAreas,
  locationDeviceId,
  newSearchSession,
} from '@/lib/location-search';

export function BrowsingLocation({
  onSelected,
  filterActive,
}: { onSelected?: () => void; filterActive?: boolean } = {}) {
  const auth = useAtomValue(authAtom);
  const historyScope = auth.user?.id ? `user:${auth.user.id}` : 'guest';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query.trim(), 700);
  const [localQuery] = useDebounce(query.trim(), 150);
  const [session, setSession] = useState(newSearchSession);
  const [recent, setRecent] = useState<RecentArea[]>([]);
  const [fallbackUntil, setFallbackUntil] = useState(0);
  const [expandSearch, setExpandSearch] = useState(false);
  const [detailBlocked, setDetailBlocked] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const resolution = useRef<AbortController | null>(null);
  const choosingGPS = useRef(false);
  const { location, requestLocation, isLoading, error } = useLocation(false);
  const select = useSetAtom(selectBrowsingLocationAtom);
  const settled = debouncedQuery === query.trim();
  const localSearch = useQuery({
    queryKey: ['smm-area-search', localQuery],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get('/locations/browsing', {
        params: { q: localQuery, local_only: 1 },
        signal,
      });
      return (response.data.data || []) as Area[];
    },
    enabled: open && !resolving && !isLoading,
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
  const exactRecent = filterRecent(recent, query).some(
    (item) =>
      item.searchText.toLowerCase() === query.trim().toLowerCase() &&
      (!item.place_id || Number.isFinite(item.latitude)),
  );
  const exactLocal =
    localQuery === query.trim() &&
    (localSearch.data || []).some(
      (item) => item.name.toLowerCase() === query.trim().toLowerCase(),
    );
  const needsGoogle = expandSearch || (!exactRecent && !exactLocal);
  const search = useQuery({
    queryKey: ['browsing-area-search', session, debouncedQuery],
    queryFn: async ({ signal }) => {
      const device = await locationDeviceId();
      const response = await apiClient.get('/locations/browsing', {
        params: { q: debouncedQuery, session_token: session },
        headers: { 'X-SMM-Device-ID': device },
        signal,
      });
      return {
        items: (response.data.data || []) as Area[],
        reason: response.data.location_search?.reason as string | null,
      };
    },
    enabled:
      open &&
      needsGoogle &&
      settled &&
      debouncedQuery.length >= 3 &&
      !resolving &&
      !isLoading &&
      Date.now() >= fallbackUntil,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    if (
      search.data?.reason === 'limit' ||
      search.data?.reason === 'unavailable'
    ) {
      setFallbackUntil(
        Date.now() + (search.data.reason === 'limit' ? 3600000 : 60000),
      );
    }
  }, [search.data]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadRecentAreas(historyScope).then((values) => {
      if (!cancelled) setRecent(values);
    });
    return () => {
      cancelled = true;
    };
  }, [open, historyScope]);
  const searching =
    open &&
    needsGoogle &&
    !resolving &&
    query.trim().length >= 3 &&
    Date.now() >= fallbackUntil &&
    (!settled || search.isFetching);
  const results = localQuery === query.trim() ? localSearch.data || [] : [];
  const googleResults =
    query.trim().length >= 3 && settled && !search.isError
      ? search.data?.items.filter((area) => area.source === 'google') || []
      : [];
  const recentResults = filterRecent(recent, query);
  function close() {
    ++request.current;
    resolution.current?.abort();
    Keyboard.dismiss();
    setOpen(false);
    setQuery('');
    setSession(newSearchSession());
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
      onSelected?.();
      Keyboard.dismiss();
      setOpen(false);
    }
  }, [isLoading, location, error, onSelected]);
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
      const cached =
        area.source === 'google' &&
        cleanRecent([
          { ...area, searchText: area.name, usedAt: Date.now() },
        ])[0];
      if (
        area.place_id &&
        !(
          cached &&
          Number.isFinite(cached.latitude) &&
          Number.isFinite(cached.longitude)
        )
      ) {
        const response = await apiClient.get('/locations/browsing/resolve', {
          params: { place_id: area.place_id, session_token: session },
          headers: { 'X-SMM-Device-ID': await locationDeviceId() },
          signal: controller.signal,
        });
        resolved = { ...response.data.data, name: area.name };
        setSession(newSearchSession());
      }
      if (id !== request.current) return;
      const searchText =
        'searchText' in area && typeof area.searchText === 'string'
          ? area.searchText
          : query.trim() || area.name;
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
        ...(resolved.source === 'google'
          ? {
              provider: 'google' as const,
              providerResolvedAt: resolved.resolved_at,
              searchText,
            }
          : {}),
      });
      const historyItem: RecentArea = {
        ...resolved,
        name: resolved.source === 'google' ? searchText : resolved.name,
        searchText,
        usedAt: Date.now(),
      };
      const values = cleanRecent([
        historyItem,
        ...recent.filter((item) => item.id !== area.id),
      ]);
      setRecent(values);
      void saveRecentAreas(values, historyScope);
      onSelected?.();
      close();
    } catch (err: any) {
      if (id === request.current && !controller.signal.aborted) {
        const message =
          err.response?.data?.error ||
          'Could not select this area. Please try again.';
        setNotice(message);
        if (
          message.includes('Map lookup is temporarily') ||
          message.includes('Map search is unavailable')
        )
          setDetailBlocked(true);
      }
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
          setDetailBlocked(false);
          setRecent([]);
          setNotice('');
          setQuery('');
          setExpandSearch(false);
          setSession(newSearchSession());
          setOpen(true);
        }}
        className="flex-row items-center px-4 py-3"
      >
        <IconSymbol name="location.fill" size={18} color="#008236" />
        <View className="flex-1 mx-2">
          <Text className="text-xs text-gray-500">
            {filterActive === false
              ? 'Location filter off'
              : 'Browsing location'}
          </Text>
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {filterActive === false
              ? 'All areas'
              : location?.address ||
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
                setExpandSearch(false);
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
          {(Date.now() < fallbackUntil || search.isError) && (
            <Text style={styles.hint}>
              Showing recent searches and SMM locations. Map search is
              temporarily unavailable.
            </Text>
          )}
          {localSearch.isError && (
            <Text style={styles.hint}>
              SMM locations could not load. Recent locations and current
              location are still available.
            </Text>
          )}
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {query.trim().length > 0 && query.trim().length < 3 && (
              <Text style={styles.hint}>
                Type 3 characters to search more places.
              </Text>
            )}
            {recentResults.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.hint}>Recent searches</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent location searches"
                  onPress={() => {
                    setRecent([]);
                    void saveRecentAreas([], historyScope);
                  }}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#008236', fontSize: 12 }}>
                    Clear history
                  </Text>
                </Pressable>
              </View>
            )}
            {recentResults.map((area) => (
              <Pressable
                key={`recent:${area.id}`}
                accessibilityRole="button"
                disabled={
                  resolving ||
                  isLoading ||
                  (detailBlocked &&
                    !!area.place_id &&
                    !Number.isFinite(area.latitude))
                }
                onPress={() => void choose(area)}
                style={styles.result}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#17251d' }}
                >
                  {area.searchText}
                </Text>
                <Text style={styles.hint}>
                  Recent search
                  {area.source === 'google' ? ' · Google Maps' : ''}
                  {area.place_id && !Number.isFinite(area.latitude)
                    ? ' · Refresh required'
                    : ''}
                </Text>
              </Pressable>
            ))}
            {!!results.length && <Text style={styles.hint}>SMM locations</Text>}
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
                <Text style={styles.hint}>
                  {area.address || 'Browse pickup in this city'}
                </Text>
              </Pressable>
            ))}
            {!!googleResults.length && (
              <Text style={styles.hint}>Google Maps</Text>
            )}
            {googleResults.map((area) => (
              <Pressable
                accessibilityRole="button"
                disabled={resolving || isLoading || detailBlocked}
                key={`google:${area.id}`}
                onPress={() => void choose(area)}
                style={styles.result}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#17251d' }}
                >
                  {area.name}
                </Text>
                <Text style={styles.hint}>Browse pickup near this place</Text>
              </Pressable>
            ))}
            {!needsGoogle &&
              query.trim().length >= 3 &&
              Date.now() >= fallbackUntil && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpandSearch(true)}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#008236', fontSize: 13 }}>
                    Search more places on Google Maps
                  </Text>
                </Pressable>
              )}
            {searching && (
              <Text style={styles.hint}>Searching more places…</Text>
            )}
            {!!query.trim() &&
              !searching &&
              !resolving &&
              !localSearch.isFetching &&
              !results.length &&
              !googleResults.length &&
              !recentResults.length && (
                <Text style={styles.hint}>
                  No matching locations. Try a nearby city or another place.
                </Text>
              )}
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
