import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const canonicalUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.tryproof.net");
  const canonicalHost = canonicalUrl.hostname.toLowerCase();
  const alternateHost = canonicalHost.startsWith("www.")
    ? canonicalHost.slice(4)
    : `www.${canonicalHost}`;

  if (request.nextUrl.hostname.toLowerCase() === alternateHost) {
    const canonicalRequest = request.nextUrl.clone();
    canonicalRequest.protocol = canonicalUrl.protocol;
    canonicalRequest.hostname = canonicalHost;
    canonicalRequest.port = canonicalUrl.port;
    return NextResponse.redirect(canonicalRequest, 308);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
