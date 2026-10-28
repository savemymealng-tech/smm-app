import type { UserLocation } from '@/lib/atoms/location';

export function exploreScope(
  enabled: boolean,
  location: UserLocation,
  radius: number,
) {
  const coords = location?.coords;
  const validCoords =
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    Math.abs(coords.latitude) <= 90 &&
    Math.abs(coords.longitude) <= 180;
  const city = location?.city?.trim();
  const distance = Number.isFinite(radius) && radius > 0 ? radius : 10;
  const params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    city?: string;
  } = !enabled
    ? {}
    : validCoords
      ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: distance,
        }
      : city
        ? { city }
        : {};
  const active = params.latitude !== undefined || !!params.city;
  return {
    params,
    active,
    label:
      params.latitude !== undefined
        ? `Selected area · ${distance} km radius`
        : params.city
          ? `In ${params.city}`
          : 'All eligible products · all areas',
    filterLabel:
      params.latitude !== undefined ? `Within ${distance} km` : params.city,
  };
}
