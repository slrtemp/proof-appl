import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Profile reports are not configured." }, { status: 503 });

  let payload: { username?: unknown; reason?: unknown };
  try {
    payload = await request.json() as { username?: unknown; reason?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid report." }, { status: 400 });
  }
  if (typeof payload.username !== "string" || !/^[a-zA-Z0-9_-]{2,32}$/.test(payload.username)) {
    return NextResponse.json({ error: "Choose a valid profile to report." }, { status: 400 });
  }
  const reason = typeof payload.reason === "string"
    ? payload.reason.replace(/[\u0000-\u001F\u007F]/g, " ").trim()
    : "";
  if (reason.length < 10 || reason.length > 1000) {
    return NextResponse.json({ error: "Add a reason between 10 and 1000 characters." }, { status: 400 });
  }

  const rateLimitSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rateLimitSecret) return NextResponse.json({ error: "Profile reports are not configured." }, { status: 503 });
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const addressHash = createHmac("sha256", rateLimitSecret)
    .update(address)
    .digest("hex");
  const { data: allowed, error: rateLimitError } = await admin.rpc("consume_profile_report_limit", {
    request_ip_hash: addressHash,
  });
  if (rateLimitError) {
    console.error("Could not check the Proof report rate limit.", rateLimitError);
    return NextResponse.json({ error: "Reports are temporarily unavailable." }, { status: 503 });
  }
  if (!allowed) return NextResponse.json({ error: "Please wait before submitting another report." }, { status: 429 });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", payload.username.toLowerCase())
    .maybeSingle();
  if (profileError) {
    console.error("Could not find the profile for a report.", profileError);
    return NextResponse.json({ error: "The report could not be submitted." }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: "That profile could not be found." }, { status: 404 });

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await admin.from("profile_reports").insert({
    profile_id: profile.id,
    reporter_id: user?.id ?? null,
    reason,
  });
  if (error) {
    console.error("Could not save a Proof profile report.", error);
    return NextResponse.json({ error: "The report could not be submitted." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
