type VendorInfo = {
  rating?: unknown;
  distance?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  verification_status?: string;
  isVerified?: boolean;
  is_featured?: boolean;
  featured?: boolean;
};
function coordinate(value: unknown, limit: number) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    String(value).trim() === ''
  )
    return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}
export function vendorRating(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 5 ? n.toFixed(1) : null;
}
export function vendorDistanceMeters(
  vendor: VendorInfo,
  location?: { latitude: number; longitude: number } | null,
): number | null {
  const lat = coordinate(vendor.latitude, 90),
    lng = coordinate(vendor.longitude, 180);
  if (
    location &&
    lat !== null &&
    lng !== null &&
    coordinate(location.latitude, 90) !== null &&
    coordinate(location.longitude, 180) !== null
  ) {
    const rad = (n: number) => (n * Math.PI) / 180;
    const a =
      Math.sin(rad(lat - location.latitude) / 2) ** 2 +
      Math.cos(rad(location.latitude)) *
        Math.cos(rad(lat)) *
        Math.sin(rad(lng - location.longitude) / 2) ** 2;
    return 6371000 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
  }
  if (vendor.distance == null || String(vendor.distance).trim() === '')
    return null;
  const match = String(vendor.distance)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(km|m)?$/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n)
    ? n * (match[2]?.toLowerCase() === 'm' ? 1 : 1000)
    : null;
}
export function vendorFlags(vendor: VendorInfo) {
  return {
    verified:
      vendor.verification_status != null
        ? vendor.verification_status === 'approved'
        : vendor.isVerified === true,
    featured:
      vendor.is_featured !== undefined
        ? vendor.is_featured === true
        : vendor.featured === true,
  };
}
