import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, TrendingUp } from "lucide-react";

import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { AppShell } from "@/components/app-shell";
import { DEMO_SHIPS } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { Ship } from "@/lib/types";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  let ships = DEMO_SHIPS;
  let isPro = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const [{ data: profile, error: profileError }, { data: accountShips, error: shipsError }] = await Promise.all([
      supabase.from("profiles").select("is_pro").eq("id", user.id).single(),
      supabase.from("ships").select("id,user_id,body,category,link,shipped_on,created_at").eq("user_id", user.id).order("shipped_on", { ascending: false }).limit(1000),
    ]);
    if (profileError || shipsError) {
      console.error("Could not load Proof analytics.", profileError || shipsError);
      throw new Error("Could not load analytics.");
    }
    isPro = profile.is_pro;
    ships = (accountShips ?? []) as Ship[];
  }

  const today = new Date().toISOString().slice(0, 10);
  const dailyCounts = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(`${today}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - (29 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: ships.filter((ship) => ship.shipped_on === key).length };
  });
  const maxCount = Math.max(1, ...dailyCounts.map((day) => day.count));

  return (
    <AppShell>
      <main className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8">
        <Link className="mb-8 inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-foreground" href="/"><ArrowLeft size={14} /> Dashboard</Link>
        <header className="mb-7">
          <p className="text-xs text-muted">Proof / Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Work in motion.</h1>
          <p className="mt-2 text-sm text-muted">A richer view of your work, your rhythm, and the progress adding up over time.</p>
        </header>

        {!isPro ? (
          <section className="relative overflow-hidden rounded-card border border-white/[0.08] bg-surface p-6 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none opacity-35 blur-[1px]">
              <div className="grid h-36 items-end gap-1 [grid-template-columns:repeat(30,minmax(0,1fr))]">{dailyCounts.map((day) => <span className="rounded-t-sm bg-white/20" key={day.date} style={{ height: `${Math.max(12, (day.count / maxCount) * 100)}%` }} />)}</div>
              <div className="mt-6 grid grid-cols-3 gap-3"><div className="h-20 rounded-control bg-elevated" /><div className="h-20 rounded-control bg-elevated" /><div className="h-20 rounded-control bg-elevated" /></div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 px-6 text-center">
              <span className="grid size-10 place-items-center rounded-full border border-white/[0.1] bg-surface"><LockKeyhole size={16} className="text-muted" /></span>
              <h2 className="mt-4 text-lg font-medium tracking-[-0.04em]">Analytics live in Pro.</h2>
              <p className="mt-2 max-w-sm text-xs leading-5 text-muted">Compare 30, 90, and 365-day trends, discover your shipping rhythm, explore category mix, and export your work history.</p>
              <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-[#7476ff]" href="/pricing">Explore Proof Pro <TrendingUp size={14} /></Link>
            </div>
          </section>
        ) : (
          <AnalyticsDashboard ships={ships} today={today} />
        )}
      </main>
    </AppShell>
  );
}
