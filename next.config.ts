import type { NextConfig } from "next";

// The Supabase URL is public. Fall back to the project URL if the env var is missing or points at supabase.com.
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseUrl = /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(configuredSupabaseUrl)
  ? configuredSupabaseUrl.replace(/\/$/, "")
  : "https://ertmrtejmcuvhojyripf.supabase.co";

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl },
  poweredByHeader: false,
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://r.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "form-action 'self' https://checkout.stripe.com",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
