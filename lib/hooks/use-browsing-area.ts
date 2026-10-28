import { useAtomValue } from "jotai";
import { locationAtom } from "@/lib/atoms/location";
import { locationRadiusAtom } from "@/lib/atoms/locationFilter";
export function useBrowsingArea() {
  const location = useAtomValue(locationAtom);
  const radius = useAtomValue(locationRadiusAtom);
  return location?.coords
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius,
      }
    : location?.city
      ? { city: location.city }
      : {};
}
