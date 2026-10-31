import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Metrics = Record<string, number>;

function rate(done: number, eligible: number) {
  return eligible > 0 ? `${Math.round((done / eligible) * 100)}%` : "—";
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-card border border-white/[0.08] bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      {note && <p className="mt-1 text-[11px] leading-4 text-muted">{note}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!adminEmail || !user?.email || user.email.toLowerCase() !== adminEmail) notFound();

  const admin = createAdminClient();
  const { data, error } = admin ? await admin.rpc("admin_metrics") : { data: null, error: new Error("not configured") };
  if (error || !data) {
    console.error("Could not load Proof admin metrics.", error);
    return (
      <AppShell>
        <main className="mx-auto max-w-[900px] px-5 py-12"><p className="text-sm text-muted">Metrics are unavailable. Check that the Phase 1 migration has run and SUPABASE_SERVICE_ROLE_KEY is set.</p></main>
      </AppShell>
    );
  }
  const m = data as Metrics;

  return (
    <AppShell>
      <main className="mx-auto max-w-[900px] px-5 py-10 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-[-0.06em]">Proof admin</h1>
        <p className="mt-2 text-xs text-muted">Counts only users old enough to be measured. Rates show — until a cohort exists.</p>

        <h2 className="mt-8 text-sm font-medium">Signups</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Stat label="Total" value={m.signups_total} />
          <Stat label="Last 7 days" value={m.signups_7d} />
          <Stat label="Last 30 days" value={m.signups_30d} />
        </div>

        <h2 className="mt-8 text-sm font-medium">Activation and retention</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label="Activation: first ship within 24 hours" value={rate(m.activation_done, m.activation_eligible)} note={`${m.activation_done} of ${m.activation_eligible} signups`} />
          <Stat label="3+ days logged in week one" value={rate(m.week_one_three_plus_days, m.week_one_eligible)} note={`${m.week_one_three_plus_days} of ${m.week_one_eligible} signups at least 7 days old`} />
          <Stat label="Week-2 return" value={rate(m.week_two_returned, m.week_two_eligible)} note={`${m.week_two_returned} of ${m.week_two_eligible} signups at least 14 days old logged in days 8–14`} />
          <Stat label="Day-3 / day-7 return" value={`${rate(m.day_3_returned, m.day_3_eligible)} / ${rate(m.day_7_returned, m.day_7_eligible)}`} note="Logged a ship on day 3 (or day 7) after signup" />
        </div>

        <h2 className="mt-8 text-sm font-medium">Activity</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Stat label="Ships logged (7d)" value={m.ships_7d} />
          <Stat label="Ships logged (all)" value={m.ships_total} />
          <Stat label="Profile views (7d)" value={m.profile_views_7d} />
          <Stat label="Card shares (7d)" value={m.card_shares_7d} />
        </div>
      </main>
    </AppShell>
  );
}
