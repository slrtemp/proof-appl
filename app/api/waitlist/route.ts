import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const admin = createAdminClient();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!admin || !secret) return NextResponse.json({ error: "The waitlist is not available yet." }, { status: 503 });

  let payload: { email?: unknown };
  try {
    payload = await request.json() as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (email.length < 3 || email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { data: allowed, error: limitError } = await admin.rpc("consume_profile_report_limit", {
    request_ip_hash: createHmac("sha256", secret).update(`waitlist:${address}`).digest("hex"),
  });
  if (limitError) {
    console.error("Could not check the Proof waitlist rate limit.", limitError);
    return NextResponse.json({ error: "The waitlist is temporarily unavailable." }, { status: 503 });
  }
  if (!allowed) return NextResponse.json({ error: "Please wait a little before trying again." }, { status: 429 });

  const { error } = await admin.from("pro_waitlist").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("Could not save a Proof waitlist signup.", error);
    return NextResponse.json({ error: "We couldn’t save that. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
