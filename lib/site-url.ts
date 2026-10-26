export const DEFAULT_SITE_URL = "https://www.tryproof.net";

export function getSiteUrl(fallback?: string): string {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || fallback || DEFAULT_SITE_URL).origin;
}

export function getSafeInternalPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";

  try {
    const target = new URL(value, "https://proof.invalid");
    if (target.origin !== "https://proof.invalid") return "/";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

export function getAuthRedirectUrl(nextPath = "/"): string {
  const origin = typeof window === "undefined" ? getSiteUrl() : getSiteUrl(window.location.origin);
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", getSafeInternalPath(nextPath));
  return callback.toString();
}
