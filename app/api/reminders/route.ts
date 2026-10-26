import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Reminder settings are not configured." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to update reminders." }, { status: 401 });

  let payload: { enabled?: unknown };
  try {
    payload = await request.json() as { enabled?: unknown };
  } catch {
    return NextResponse.json({ error: "Choose whether reminders are enabled." }, { status: 400 });
  }
  if (typeof payload.enabled !== "boolean") {
    return NextResponse.json({ error: "Choose whether reminders are enabled." }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await admin
    .from("account_reminders")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError) {
    console.error("Could not load Proof reminder preferences.", lookupError);
    return NextResponse.json({ error: "Reminder settings could not be loaded." }, { status: 500 });
  }

  const result = existing
    ? await admin.from("account_reminders").update({ enabled: payload.enabled, updated_at: new Date().toISOString() }).eq("user_id", user.id)
    : await admin.from("account_reminders").insert({ user_id: user.id, enabled: payload.enabled });
  if (result.error) {
    console.error("Could not save Proof reminder preferences.", result.error);
    return NextResponse.json({ error: "Reminder settings could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ enabled: payload.enabled });
}
