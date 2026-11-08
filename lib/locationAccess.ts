import {
  traceLocation,
  safeLocationError,
  locationShape,
} from './location-diagnostic-trace';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'restricted';

// Share an in-progress permission request across screens and the address picker.
let permissionRequest: ReturnType<
  typeof Location.requestForegroundPermissionsAsync
> | null = null;

export async function getLocationAccess(allowPrompt = false) {
  let permission = await Location.getForegroundPermissionsAsync();
  let servicesEnabled = await Location.hasServicesEnabledAsync();
  if (allowPrompt && !servicesEnabled && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      /* User may decline the system dialog. */
    }
    servicesEnabled = await Location.hasServicesEnabledAsync();
  }
  if (
    servicesEnabled &&
    allowPrompt &&
    permission.status !== 'granted' &&
    permission.status !== ('restricted' as string) &&
    permission.canAskAgain
  ) {
    permissionRequest ??= Location.requestForegroundPermissionsAsync();
    try {
      permission = await permissionRequest;
    } finally {
      permissionRequest = null;
    }
  }
  // Permanent denial/restriction stays non-prompting; automatic checks never ask.
  const status = permission.status as LocationPermissionStatus;
  return {
    status,
    available: servicesEnabled && status === 'granted',
    message: !servicesEnabled
      ? 'Location Services are off. Turn them on in Settings, or choose a browsing area.'
      : 'Location is optional. Enable it in Settings to automatically find nearby vendors, or continue without it.',
  };
}

export function withLocationTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Location request timed out')),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
function validPosition(position: Location.LocationObject | null) {
  return (
    !!position &&
    Number.isFinite(position.coords?.latitude) &&
    Number.isFinite(position.coords?.longitude) &&
    Math.abs(position.coords.latitude) <= 90 &&
    Math.abs(position.coords.longitude) <= 180
  );
}
function watchAndroidPosition(
  allowPrompt: boolean,
  timeoutMs: number,
): Promise<Location.LocationObject> {
  return new Promise((resolve, reject) => {
    let subscription: Location.LocationSubscription | undefined;
    let settled = false;
    const finish = (position?: Location.LocationObject, error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription?.remove();
      if (allowPrompt)
        traceLocation(
          position
            ? 'watch_finished_with_position'
            : 'watch_finished_with_error',
          position
            ? locationShape(position)
            : safeLocationError(
                error || new Error('Location request timed out'),
              ),
        );
      if (position) resolve(position);
      else reject(error || new Error('Location request timed out'));
    };
    const timer = setTimeout(() => finish(), timeoutMs);
    if (allowPrompt) traceLocation('watch_start');
    Location.watchPositionAsync(
      {
        // Browsing supports approximate permission and does not need a navigation-grade fix.
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: allowPrompt,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (position) => {
        if (allowPrompt)
          traceLocation('watch_callback', locationShape(position));
        if (validPosition(position)) finish(position);
      },
      (error) => {
        if (allowPrompt)
          traceLocation('watch_provider_error', safeLocationError(error));
        // Android can report temporary unavailability before its first fix.
        // Keep the subscription alive until a fix or the deadline, then remove it.
      },
    ).then(
      (value) => {
        if (allowPrompt) traceLocation('watch_registered');
        subscription = value;
        if (settled) value.remove(); // Also clean up a late registration after timeout.
      },
      (error) => finish(undefined, error),
    );
  });
}
const positionRequests: Partial<
  Record<'interactive' | 'quiet', Promise<Location.LocationObject>>
> = {};
export function getPositionForBrowsing(
  allowPrompt = false,
  timeoutMs = 20000,
): Promise<Location.LocationObject> {
  const mode = allowPrompt ? 'interactive' : 'quiet';
  const existing = positionRequests[mode];
  if (existing) return existing;
  const work = (async () => {
    try {
      const position =
        Platform.OS === 'android'
          ? await watchAndroidPosition(allowPrompt, timeoutMs)
          : await withLocationTimeout(
              Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }),
              timeoutMs,
            );
      if (!validPosition(position))
        throw new Error('Location provider returned invalid coordinates');
      return position;
    } catch (error) {
      if (Platform.OS === 'android' && allowPrompt) {
        // Some providers fail to deliver subscription events but still support a one-shot fix.
        try {
          traceLocation('single_fix_start');
          const position = await withLocationTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: false,
            }),
            Math.min(timeoutMs, 6000),
          );
          traceLocation('single_fix_result', locationShape(position));
          if (validPosition(position)) return position;
        } catch (singleError) {
          traceLocation('single_fix_error', safeLocationError(singleError));
        }
      }
      try {
        // Android approximate permission often provides a fix less precise than 500m.
        const accuracy = Platform.OS === 'android' ? 5000 : 500;
        if (allowPrompt) traceLocation('cached_fix_start');
        const last = await withLocationTimeout(
          Location.getLastKnownPositionAsync({
            maxAge: 120000,
            requiredAccuracy: accuracy,
          }),
          2000,
        );
        if (allowPrompt)
          traceLocation('cached_fix_result', locationShape(last));
        if (
          validPosition(last) &&
          last &&
          Date.now() - last.timestamp <= 120000 &&
          last.timestamp <= Date.now() &&
          last.coords.accuracy != null &&
          last.coords.accuracy <= accuracy
        )
          return last;
      } catch (fallbackError) {
        if (allowPrompt)
          traceLocation('cached_fix_error', safeLocationError(fallbackError));
        /* No usable recent position. */
      }
      throw error;
    }
  })();
  const pending = work.finally(() => {
    if (positionRequests[mode] === pending) delete positionRequests[mode];
  });
  positionRequests[mode] = pending;
  return pending;
}
export function locationFailureMessage(error: unknown) {
  const issue = error as { code?: string; message?: string };
  if (
    /unauthor|permission/i.test(`${issue?.code || ''} ${issue?.message || ''}`)
  )
    return 'Location permission is unavailable. Allow location access in app Settings, then try again.';
  if (Platform.OS === 'android')
    return 'Your phone could not get a location fix. In Location settings, turn on Google Location Accuracy (if available), then try again. You can also choose a browsing area.';
  return 'Your phone could not get a location fix. Check Location Services in Settings and try again, or choose a browsing area.';
}
