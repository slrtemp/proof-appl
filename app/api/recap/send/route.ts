import { NextResponse } from "next/server";

import { buildWeeklyRecap, daysBetween, formatRecapEmail, localWeekday } from "@/lib/recap";
import { getDateKey } from "@/lib/dates";
import { shiftDate } from "@/lib/streaks";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Ship } from "@/lib/types";

export const maxDuration = 60;

async function sendRecaps(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const admin = createAdminClient();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REMINDER_FROM_EMAIL;
  if (!admin || !resendApiKey || !fromEmail) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
  }

  const { data: subscribers, error: subscribersError } = await admin
    .from("account_reminders")
    .select("user_id,unsubscribe_token,last_recap_on,goal")
    .eq("recap_enabled", true)
    .limit(500);
  if (subscribersError) {
    console.error("Could not load Proof recap subscribers.", subscribersError);
    return NextResponse.json({ error: "Recap subscribers could not be loaded." }, { status: 500 });
  }
  if (!subscribers?.length) return NextResponse.json({ sent: 0 });

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id,timezone")
    .in("id", subscribers.map((subscriber) => subscriber.user_id));
  if (profilesError) {
    console.error("Could not load Proof recap profiles.", profilesError);
    return NextResponse.json({ error: "Recap profiles could not be loaded." }, { status: 500 });
  }
  const timezones = new Map((profiles ?? []).map((profile) => [profile.id, profile.timezone || "UTC"]));

  const now = new Date();
  const origin = getSiteUrl();
  let sent = 0;

  for (const subscriber of subscribers) {
    const timeZone = timezones.get(subscriber.user_id) ?? "UTC";
    const localDate = getDateKey(now, timeZone);
    // The daily job reaches every timezone on Sunday or Monday; last_recap_on prevents a second send that week.
    const weekday = localWeekday(now, timeZone);
    if (weekday !== 0 && weekday !== 1) continue;
    if (subscriber.last_recap_on && daysBetween(subscriber.last_recap_on, localDate) < 6) continue;

    const [{ data: ships, error: shipsError }, { data: restDays, error: restDaysError }] = await Promise.all([
      admin.from("ships").select("id,user_id,body,category,link,shipped_on,created_at").eq("user_id", subscriber.user_id).order("shipped_on", { ascending: false }).limit(1000),
      admin.from("rest_days").select("rest_on").eq("user_id", subscriber.user_id).limit(1000),
    ]);
    if (shipsError || restDaysError) {
      console.error("Could not load data for a Proof recap.", shipsError || restDaysError);
      continue;
    }

    const recap = buildWeeklyRecap((ships ?? []) as Ship[], (restDays ?? []).map((day) => day.rest_on), {
      endDate: shiftDate(localDate, -1),
      timeZone,
      now,
      goal: subscriber.goal,
    });
    if (recap.total === 0) continue;

    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(subscriber.user_id);
    const email = authUser?.user?.email;
    if (authError || !email) continue;

    const unsubscribeUrl = new URL("/api/reminders/unsubscribe", origin);
    unsubscribeUrl.searchParams.set("token", subscriber.unsubscribe_token);
    unsubscribeUrl.searchParams.set("kind", "recap");
    const message = formatRecapEmail(recap, { app: `${origin}/`, unsubscribe: unsubscribeUrl.toString() });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: message.subject,
        text: message.text,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      }),
    });
    if (!response.ok) {
      console.error("Proof recap delivery failed.", { userId: subscriber.user_id, status: response.status });
      continue;
    }
    const { error: updateError } = await admin.from("account_reminders")
      .update({ last_recap_on: localDate, updated_at: new Date().toISOString() })
      .eq("user_id", subscriber.user_id);
    if (updateError) console.error("Could not record the sent Proof recap.", updateError);
    sent += 1;
  }

  return NextResponse.json({ sent });
}

// Vercel Cron calls GET; POST is kept for manual runs.
export const GET = sendRecaps;
export const POST = sendRecaps;
