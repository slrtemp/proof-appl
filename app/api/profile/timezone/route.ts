import { NextResponse } from "next/server";

import { isValidTimeZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to update your timezone." }, { status: 401 });

  let payload: { timeZone?: unknown };
  try {
    payload = await request.json() as { timeZone?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid timezone." }, { status: 400 });
  }
  if (typeof payload.timeZone !== "string" || payload.timeZone.length > 100 || !isValidTimeZone(payload.timeZone)) {
    return NextResponse.json({ error: "Choose a valid timezone." }, { status: 400 });
  }

  const { error } = await supabase.rpc("set_profile_timezone", { new_timezone: payload.timeZone });
  if (error) {
    if (error.message.includes("Choose a valid timezone.")) {
      return NextResponse.json({ error: "Choose a valid timezone." }, { status: 400 });
    }
    console.error("Could not save the Proof timezone.", error);
    return NextResponse.json({ error: "Your timezone could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ timeZone: payload.timeZone });
}
