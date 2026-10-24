import Link from "next/link";
import { ArrowRight, Check, Flame, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { DEMO_SHIPS } from "@/lib/demo";
import { dateLabel, getStreakStats } from "@/lib/streaks";
import { CATEGORY_COLORS } from "@/lib/types";

export default function WelcomePage() {
  const stats = getStreakStats(DEMO_SHIPS);
  const newest = [...DEMO_SHIPS].sort((a, b) => b.shipped_on.localeCompare(a.shipped_on)).slice(0, 3);
  return (
    <AppShell>
      <main className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1fr_430px] lg:gap-16">
          <div>
            <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-300/[0.06] px-3 text-[11px] font-medium text-indigo-100/80"><Sparkles size={13} /> A daily log for people who build</p>
            <h1 className="mt-6 max-w-[660px] text-[46px] font-semibold leading-[1.02] tracking-[-0.075em] sm:text-[64px]">The work behind<br />the win, <span className="bg-gradient-to-r from-[#c7d2fe] via-[#a5b4fc] to-[#c4b5fd] bg-clip-text text-transparent">remembered.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">Proof is a calm home for the work that usually goes unseen. Capture one small ship each day, watch your progress take shape, and share the story when you’re ready.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-12 items-center gap-2 rounded-control bg-accent px-5 text-sm font-medium text-white shadow-lg shadow-indigo-950/40 transition-all hover:-translate-y-px hover:bg-[#7476ff]" href="/login">Start your free log <ArrowRight size={15} /></Link>
              <Link className="inline-flex min-h-12 items-center gap-2 rounded-control border border-white/[0.1] px-5 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.04]" href="/alex-morgan">See it in action</Link>
            </div>
            <p className="mt-4 text-[11px] text-muted">Free for the essentials <span className="px-1.5 text-white/20">·</span> No card required</p>
          </div>
          <div className="relative overflow-hidden rounded-card border border-white/[0.09] bg-gradient-to-b from-[#17171d] to-surface p-5 shadow-2xl shadow-black/30">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />
            <div className="mb-5 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full border border-indigo-200/15 bg-gradient-to-br from-indigo-300/20 to-elevated text-xs font-semibold text-indigo-100">AM</div>
              <div className="min-w-0 flex-1"><p className="text-xs font-medium">Alex Morgan</p><p className="mt-0.5 truncate text-[11px] text-muted">@alex-morgan <span className="px-1 text-white/20">·</span> building in public</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/10 bg-orange-300/[0.05] px-2.5 py-1 text-[11px] font-medium text-orange-100/80"><Flame size={12} />{stats.current} day streak</span>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Recent proof</p>
              <span className="text-[10px] text-muted">Small steps, adding up</span>
            </div>
            {newest.map((ship) => (
              <article className="border-t border-white/[0.07] py-3 first:border-0 first:pt-0" key={ship.id}>
                <p className="text-sm leading-6">{ship.body}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${CATEGORY_COLORS[ship.category]}12`, borderColor: `${CATEGORY_COLORS[ship.category]}30`, color: CATEGORY_COLORS[ship.category] }}>{ship.category}</span>
                  <span className="text-[10px] text-muted">{dateLabel(ship.shipped_on)}</span>
                </div>
              </article>
            ))}
            <div className="mt-1 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[11px] text-muted"><Check className="text-emerald-300" size={13} />{stats.total} small steps, all in one place</div>
          </div>
        </section>
        <section className="mt-20 grid gap-3 border-t border-white/[0.08] pt-8 sm:grid-cols-3">
          {[["01", "Ship daily", "One honest sentence. A link if you want. That’s the whole ritual."], ["02", "See the pattern", "A streak and a year of activity, without turning your life into a scoreboard."], ["03", "Share what matters", "A clean public page and share card. No performative productivity." ]].map(([number, title, text]) => (
            <article className="rounded-card border border-white/[0.07] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.025]" key={number}><p className="text-[10px] font-medium tracking-[0.14em] text-indigo-200/70">{number} <span className="text-white/25">/ 03</span></p><h2 className="mt-4 text-base font-medium tracking-[-0.03em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>
          ))}
        </section>
        <section className="mt-16 overflow-hidden rounded-card border border-white/[0.08] bg-surface" aria-labelledby="founder-note-title">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-between border-b border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">A note from the founder</p>
                <h2 className="mt-5 max-w-xs text-3xl font-semibold leading-[1.05] tracking-[-0.065em]" id="founder-note-title">Built between classes, for the long game.</h2>
              </div>
              <p className="mt-8 text-xs text-muted">Markens Rene <span className="px-1.5 text-white/20">/</span> Founder of Proof</p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-base leading-7 text-[#c5c5cc]">
                Hello, my name is Markens. I’m 18 and a first-year student studying computer science at Wentworth Institute of Technology. I believe meaningful things are built one small, consistent step at a time—and that the work behind an idea deserves to be seen, not just the finished result.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">
                I started Proof to give builders a simple place to record what they actually shipped: the late-night fix, the first draft, the experiment that taught you something. Not another pressure-filled productivity score. Just a clear record that you showed up, room to reflect, and a way to share the journey with people who care.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">Thanks for being here and building alongside me. Small ships add up.</p>
            </div>
          </div>
        </section>
        <div className="mt-14 flex flex-col justify-between gap-4 rounded-card border border-white/[0.08] bg-surface p-6 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-medium tracking-[-0.04em]">Start with the thing you did today.</h2><p className="mt-1 text-sm text-muted">No backlog. No setup. Just one ship.</p></div>
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-medium text-white hover:bg-[#7476ff]" href="/login">Create your log <ArrowRight size={15} /></Link>
        </div>
      </main>
    </AppShell>
  );
}
