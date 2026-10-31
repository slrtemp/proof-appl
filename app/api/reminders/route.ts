import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_GOAL_LENGTH = 120;

// Saves private email and goal preferences. Only the fields sent are changed.
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Preferences are not configured." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to update your preferences." }, { status: 401 });

  let payload: { enabled?: unknown; recapEnabled?: unknown; goal?: unknown };
  try {
    payload = await request.json() as { enabled?: unknown; recapEnabled?: unknown; goal?: unknown };
  } catch {
    return NextResponse.json({ error: "Send valid preferences." }, { status: 400 });
  }

  const changes: { enabled?: boolean; recap_enabled?: boolean; goal?: string } = {};
  if (payload.enabled !== undefined) {
    if (typeof payload.enabled !== "boolean") return NextResponse.json({ error: "Choose whether reminders are enabled." }, { status: 400 });
    changes.enabled = payload.enabled;
  }
  if (payload.recapEnabled !== undefined) {
    if (typeof payload.recapEnabled !== "boolean") return NextResponse.json({ error: "Choose whether the weekly recap is enabled." }, { status: 400 });
    changes.recap_enabled = payload.recapEnabled;
  }
  if (payload.goal !== undefined) {
    if (typeof payload.goal !== "string") return NextResponse.json({ error: "Enter your goal as text." }, { status: 400 });
    const goal = payload.goal.replace(/[\u0000-\u001F\u007F]/g, " ").trim();
    if (goal.length > MAX_GOAL_LENGTH) return NextResponse.json({ error: `Keep your goal under ${MAX_GOAL_LENGTH} characters.` }, { status: 400 });
    changes.goal = goal;
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { error } = await admin
    .from("account_reminders")
    .upsert({ user_id: user.id, ...changes, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    console.error("Could not save Proof preferences.", error);
    return NextResponse.json({ error: "Your preferences could not be saved." }, { status: 500 });
  }
  return NextResponse.json(changes);
}
