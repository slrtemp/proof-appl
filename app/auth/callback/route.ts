import { NextResponse, type NextRequest } from "next/server";

import { getSafeInternalPath, getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeInternalPath(request.nextUrl.searchParams.get("next"));
  const origin = getSiteUrl(request.nextUrl.origin);
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("next", next);

  if (request.nextUrl.searchParams.has("error") || request.nextUrl.searchParams.has("error_code")) {
    loginUrl.searchParams.set("error", "auth-provider");
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      loginUrl.searchParams.set("error", "auth-not-configured");
      return NextResponse.redirect(loginUrl);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("Could not complete the Proof sign-in callback.", error);
    loginUrl.searchParams.set("error", "auth-callback");
  } else {
    loginUrl.searchParams.set("error", "auth-callback");
  }
  return NextResponse.redirect(loginUrl);
}
