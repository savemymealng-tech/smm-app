import { resolveAppLink } from "@/lib/deep-links";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function RedirectScreen() {
  const values = useLocalSearchParams<Record<string, string | string[]>>();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (typeof value === "string") query.set(key, value);
  return (
    <Redirect
      href={(resolveAppLink("/redirect?" + query.toString()) || "/") as any}
    />
  );
}
