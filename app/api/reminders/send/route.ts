import { NextResponse } from "next/server";

import { getDateKey } from "@/lib/dates";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const admin = createAdminClient();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REMINDER_FROM_EMAIL;
  if (!admin || !resendApiKey || !fromEmail) {
    return NextResponse.json({ error: "Reminder email delivery is not configured." }, { status: 503 });
  }

  const { data: reminders, error: remindersError } = await admin
    .from("account_reminders")
    .select("user_id,unsubscribe_token,last_sent_on")
    .eq("enabled", true)
    .limit(500);
  if (remindersError) {
    console.error("Could not load Proof reminder preferences.", remindersError);
    return NextResponse.json({ error: "Reminder preferences could not be loaded." }, { status: 500 });
  }

  let sent = 0;
  const origin = getSiteUrl();
  for (const reminder of reminders ?? []) {
    const [{ data: profile, error: profileError }, { data: authUser, error: authError }] = await Promise.all([
      admin.from("profiles").select("timezone").eq("id", reminder.user_id).maybeSingle(),
      admin.auth.admin.getUserById(reminder.user_id),
    ]);
    if (profileError || authError) {
      console.error("Could not resolve a Proof reminder recipient.", profileError || authError);
      continue;
    }
    const email = authUser.user?.email;
    if (!email) continue;
    const timezone = profile?.timezone || "UTC";
    const now = new Date();
    const localDate = getDateKey(now, timezone);
    const localHour = Number(new Intl.DateTimeFormat("en", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" }).format(now));
    if (localHour !== 9 || reminder.last_sent_on === localDate) continue;

    const [{ data: ship }, { data: restDay }] = await Promise.all([
      admin.from("ships").select("id").eq("user_id", reminder.user_id).eq("shipped_on", localDate).maybeSingle(),
      admin.from("rest_days").select("id").eq("user_id", reminder.user_id).eq("rest_on", localDate).maybeSingle(),
    ]);
    if (ship || restDay) continue;

    const unsubscribeUrl = new URL("/api/reminders/unsubscribe", origin);
    unsubscribeUrl.searchParams.set("token", reminder.unsubscribe_token);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: "A gentle Proof reminder",
        text: `If you made something today, you can leave a note in Proof. No pressure—rest is part of the work.\n\n${origin}/\n\nUnsubscribe from reminders: ${unsubscribeUrl}`,
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
      }),
    });
    if (!response.ok) {
      console.error("Proof reminder delivery failed.", { userId: reminder.user_id, status: response.status });
      continue;
    }
    const { error: updateError } = await admin.from("account_reminders")
      .update({ last_sent_on: localDate, updated_at: new Date().toISOString() })
      .eq("user_id", reminder.user_id);
    if (updateError) {
      console.error("Could not record the sent Proof reminder.", updateError);
      continue;
    }
    sent += 1;
  }

  return NextResponse.json({ sent });
}
