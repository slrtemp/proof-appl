import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to mark a rest day." }, { status: 401 });

  const { data: restOn, error } = await supabase.rpc("mark_today_rest_day");
  if (error) {
    const message = error.message.includes("two rest days")
      ? "You’ve used this month’s two rest days."
      : error.message.includes("already logged")
        ? "A ship is already logged for today."
        : "Today’s rest day could not be saved.";
    if (!message.startsWith("Today")) return NextResponse.json({ error: message }, { status: 409 });
    console.error("Could not mark a Proof rest day.", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ restOn });
}

export async function DELETE() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to update a rest day." }, { status: 401 });

  const { error } = await supabase.rpc("remove_today_rest_day");
  if (error) {
    console.error("Could not remove a Proof rest day.", error);
    return NextResponse.json({ error: "Today’s rest day could not be removed." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
