import { resolveAppLink } from "@/lib/deep-links";

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  return resolveAppLink(path) || "/";
}
