import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EVENTS = new Set(["profile_viewed", "card_shared"]);

// Records an anonymous daily counter. Nothing identifying the visitor is stored.
export async function POST(request: Request) {
  let payload: { event?: unknown; username?: unknown };
  try {
    payload = await request.json() as { event?: unknown; username?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  if (typeof payload.event !== "string" || !EVENTS.has(payload.event)
    || typeof payload.username !== "string" || !/^[a-zA-Z0-9_-]{2,32}$/.test(payload.username)) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return new NextResponse(null, { status: 204 });

  const { data: profile } = await admin.from("profiles").select("id").eq("username", payload.username.toLowerCase()).eq("is_public", true).maybeSingle();
  if (!profile) return new NextResponse(null, { status: 204 });

  if (payload.event === "profile_viewed") {
    const supabase = await createClient();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (user?.id === profile.id) return new NextResponse(null, { status: 204 });
  }

  const { error } = await admin.rpc("record_event", { event_name: payload.event, subject: profile.id });
  if (error) console.error("Could not record a Proof event.", error);
  return new NextResponse(null, { status: 204 });
}
