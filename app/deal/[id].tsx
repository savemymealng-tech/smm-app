import { useLocalSearchParams } from "expo-router";
import OfferCollection from "@/components/discovery/OfferCollection";
export default function Collection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OfferCollection kind="deal" id={id} />;
}
