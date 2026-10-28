import { useAtomValue } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { authAtom } from "@/lib/atoms/auth";
import { locationAtom } from "@/lib/atoms/location";
import { locationRadiusAtom } from "@/lib/atoms/locationFilter";
import { discoveryApi, type Area } from "@/lib/api/discovery";
export function useDiscoveryArea(): Area {
  const location = useAtomValue(locationAtom),
    radius = useAtomValue(locationRadiusAtom);
  return location?.coords
    ? { ...location.coords, radius }
    : location?.city
      ? { city: location.city }
      : {};
}
export function useHomeDiscovery() {
  const area = useDiscoveryArea(),
    auth = useAtomValue(authAtom);
  return useQuery({
    queryKey: ["home-discovery", area, auth.user?.id || "guest"],
    queryFn: () => discoveryApi.home(area),
    enabled: !auth.isLoading,
    staleTime: 60_000,
  });
}
