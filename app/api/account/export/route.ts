import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function csvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to export your account." }, { status: 401 });

  const [
    { data: profile, error: profileError },
    { data: ships, error: shipsError },
    { data: restDays, error: restDaysError },
    { data: reminder, error: reminderError },
  ] = await Promise.all([
    supabase.from("profiles").select("username,full_name,tagline,bio,location,website,avatar_url,is_public,timezone,created_at").eq("id", user.id).single(),
    supabase.from("ships").select("body,category,link,shipped_on,created_at").eq("user_id", user.id).order("shipped_on", { ascending: false }),
    supabase.from("rest_days").select("rest_on,created_at").eq("user_id", user.id).order("rest_on", { ascending: false }),
    supabase.from("account_reminders").select("enabled,updated_at").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profileError || shipsError || restDaysError || reminderError) {
    console.error("Could not export the Proof account.", profileError || shipsError || restDaysError || reminderError);
    return NextResponse.json({ error: "Your account export could not be prepared." }, { status: 500 });
  }

  const data = { exportedAt: new Date().toISOString(), email: user.email ?? null, profile, ships, restDays, reminder };
  const format = new URL(request.url).searchParams.get("format");
  if (format === "csv") {
    const rows = [
      ["Date", "Category", "Work shipped", "Link"],
      ...(ships ?? []).map((ship) => [ship.shipped_on, ship.category, ship.body, ship.link ?? ""]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="proof-ships-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="proof-account-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
