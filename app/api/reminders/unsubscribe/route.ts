import { NextResponse, type NextRequest } from "next/server";

import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  const token = request.nextUrl.searchParams.get("token");
  if (!admin || !token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return NextResponse.redirect(new URL("/support?reminder=unsubscribe-error", getSiteUrl(request.nextUrl.origin)));
  }

  const { error } = await admin
    .from("account_reminders")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token);
  if (error) {
    console.error("Could not unsubscribe from Proof reminders.", error);
    return NextResponse.redirect(new URL("/support?reminder=unsubscribe-error", getSiteUrl(request.nextUrl.origin)));
  }
  return NextResponse.redirect(new URL("/support?reminder=unsubscribed", getSiteUrl(request.nextUrl.origin)));
}
