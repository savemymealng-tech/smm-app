/** Normalize published, legacy and custom-scheme links before Expo Router resolves them.
 * Keep this pure module identical in the mobile and frontend projects.
 */
export function resolveAppLink(input: string): string | null {
  try {
    if (!input || input.length > 8192 || /[\\\u0000-\u001f]/.test(input))
      return null;
    let path = input;
    if (/^[a-z][a-z0-9+.-]*:/i.test(input)) {
      const url = new URL(input);
      if (url.protocol === "savemymeal:")
        path = "/" + url.hostname + url.pathname + url.search;
      else if (
        url.protocol === "https:" &&
        ["savemymeal.com", "www.savemymeal.com"].includes(url.hostname) &&
        !url.port &&
        !url.username &&
        !url.password
      )
        path = url.pathname + url.search;
      else if (["exp:", "exps:"].includes(url.protocol))
        path = url.pathname.replace(/^.*\/--\//, "/") + url.search;
      else return null;
    }
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    const url = new URL(path, "https://savemymeal.com");
    let route = url.pathname.replace(/\/+$/, "") || "/";
    let params = url.searchParams;
    if (route === "/app/redirect" || route === "/redirect") {
      const target = params.get("path") || "/";
      if (
        !target.startsWith("/") ||
        target.startsWith("//") ||
        target.includes("\\") ||
        /[\u0000-\u001f]/.test(target)
      )
        return null;
      const nested = new URL(target, "https://savemymeal.com");
      if (nested.origin !== "https://savemymeal.com") return null;
      const merged = new URLSearchParams(nested.search);
      new URLSearchParams(params.get("params") || "").forEach((value, key) =>
        merged.set(key, value),
      );
      params.forEach((value, key) => {
        if (!["path", "params"].includes(key)) merged.set(key, value);
      });
      route = nested.pathname.replace(/\/+$/, "") || "/";
      params = merged;
    }
    route = route.replace(/^\/app(?=\/|$)/, "") || "/";
    route = route.replace(
      /^\/(products|vendors|restaurants|restaurant)\//,
      (_, kind: string) => (kind === "products" ? "/product/" : "/vendor/"),
    );
    route = route.replace(/^\/orders\/(.+)$/, "/order/$1");
    const referral = route.match(/^\/ref\/([a-zA-Z0-9_-]{3,40})$/);
    if (referral) {
      route = "/signup";
      params.set("referral_code", referral[1].toUpperCase());
    }
    const allowed =
      /^(?:\/|\/\(tabs\)(?:\/(?:explore|cart|profile))?|\/(?:explore|cart|vendors|orders|rewards|packs|checkout|login|signup|verify-otp|verify-email|forgot-password|reset-password|verify-reset-code|new-password)|\/payment\/callback|\/(?:product|vendor|category|deal|campaign|pack)\/[1-9]\d*|\/order\/[a-zA-Z0-9_-]+)$/;
    if (!allowed.test(route)) return null;
    // Never propagate redirect or arbitrary route parameters from external URLs.
    const keys: Record<string, string[]> = {
      "/signup": ["referral_code"],
      "/verify-otp": ["code", "email"],
      "/verify-email": ["token"],
      "/reset-password": ["token"],
      "/verify-reset-code": ["email", "code"],
      "/payment/callback": ["reference", "trxref", "status"],
      "/explore": ["category", "search"],
      "/vendors": ["filter"],
    };
    const safe = new URLSearchParams();
    for (const key of keys[route] || []) {
      const value = params.get(key);
      if (value && value.length <= 4000) safe.set(key, value);
    }
    return route + (safe.toString() ? "?" + safe.toString() : "");
  } catch {
    return null;
  }
}

export function appSchemeLink(destination: string): string {
  const resolved = resolveAppLink(destination) || "/";
  return "savemymeal://" + resolved.replace(/^\//, "");
}
