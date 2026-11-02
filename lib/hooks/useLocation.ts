/** Location enhances browsing; it never gates navigation. */
import * as Location from "expo-location";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import {
  locationAtom,
  locationReadyAtom,
  locationRevisionAtom,
  initializeLocationAtom,
  selectBrowsingLocationAtom,
  type UserLocation,
} from "../atoms/location";
import {
  getLocationAccess,
  getPositionForBrowsing,
  withLocationTimeout,
  type LocationPermissionStatus,
} from "../locationAccess";

export type { LocationPermissionStatus } from "../locationAccess";

export interface UseLocationReturn {
  location: UserLocation;
  isLoading: boolean;
  error: string | null;
  permissionStatus: LocationPermissionStatus;
  requestLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  openSettings: () => Promise<void>;
}

/** autoRequest refreshes already-authorized GPS only; it never prompts. */
export function useLocation(autoRequest: boolean = true): UseLocationReturn {
  const [location, setLocation] = useAtom(locationAtom);
  const ready = useAtomValue(locationReadyAtom);
  const initialize = useSetAtom(initializeLocationAtom);
  const select = useSetAtom(selectBrowsingLocationAtom);
  const store = useStore();
  useEffect(() => {
    const expiry =
      location?.provider === "google"
        ? (location.providerResolvedAt || 0) + 29 * 86400000
        : null;
    if (expiry === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      const remaining = expiry - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) select(null);
      else timer = setTimeout(check, Math.min(remaining, 2147483647));
    };
    check();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      clearTimeout(timer);
      listener.remove();
    };
  }, [location?.provider, location?.providerResolvedAt, select]);
  useEffect(() => {
    void initialize();
  }, [initialize]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const inFlight = useRef(false);

  /**
   * Get current position
   */
  const getCurrentPosition = useCallback(
    async (allowPrompt: boolean): Promise<UserLocation | null> => {
      try {
        const position = await getPositionForBrowsing(allowPrompt);

        const userLocation: UserLocation = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          timestamp: position.timestamp,
          source: "gps",
        };

        // Try to get address (reverse geocoding)
        try {
          const [address] = await withLocationTimeout(
            Location.reverseGeocodeAsync({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
            3000,
          );

          if (address) {
            const addressParts = [
              address.street,
              address.city,
              address.region,
            ].filter(Boolean);

            userLocation.address = addressParts.join(", ");
          }
        } catch (geocodeErr) {
          // Reverse geocoding is optional, don't fail if it doesn't work
          console.log("Reverse geocoding failed:", geocodeErr);
        }

        return userLocation;
      } catch (err: any) {
        console.error("Error getting current position:", err);
        throw new Error(err.message || "Failed to get current location");
      }
    },
    [],
  );

  const updateLocation = useCallback(
    async (allowPrompt: boolean) => {
      if (
        inFlight.current ||
        (!allowPrompt && store.get(locationAtom)?.source === "manual")
      )
        return;
      const revision = store.get(locationRevisionAtom);
      const commit = (value: UserLocation) => {
        if (store.get(locationRevisionAtom) !== revision) return;
        if (allowPrompt && value) select(value);
        else if (store.get(locationAtom)?.source !== "manual")
          setLocation(value);
      };
      inFlight.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const access = await getLocationAccess(allowPrompt);
        setPermissionStatus(access.status);
        if (!access.available) {
          commit(null);
          if (allowPrompt) setError(access.message);
          return;
        }
        const nextLocation = await getCurrentPosition(allowPrompt);
        // Permission/services may have changed while GPS or geocoding was pending.
        const latest = await getLocationAccess(false);
        setPermissionStatus(latest.status);
        commit(latest.available ? nextLocation : null);
        if (!latest.available && allowPrompt) setError(latest.message);
      } catch (err: any) {
        commit(null);
        if (allowPrompt)
          setError(
            "Current location is unavailable. You can continue browsing or choose another browsing area.",
          );
        console.error("Location error:", err);
      } finally {
        inFlight.current = false;
        setIsLoading(false);
      }
    },
    [getCurrentPosition, setLocation, select, store],
  );

  const requestLocation = useCallback(
    () => updateLocation(true),
    [updateLocation],
  );
  const refreshLocation = useCallback(
    () => updateLocation(false),
    [updateLocation],
  );
  const openSettings = useCallback(async () => {
    try {
      if (
        Platform.OS === "android" &&
        !(await Location.hasServicesEnabledAsync())
      ) {
        await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
      } else await Linking.openSettings();
    } catch {
      setError("Unable to open Settings. You can continue without location.");
    }
  }, []);

  useEffect(() => {
    if (!autoRequest || !ready) return;
    void refreshLocation();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshLocation();
    });
    return () => subscription.remove();
  }, [autoRequest, ready, refreshLocation]);

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    requestLocation,
    refreshLocation,
    openSettings,
  };
}

export default useLocation;
