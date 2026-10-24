import Link from "next/link";
import { ArrowRight, Award, BarChart3, Check, Globe2, Palette, Sparkles, TreePine } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { BillingButton } from "@/components/billing-button";

const proFeatures = [
  { icon: <Globe2 size={16} />, title: "Your own domain", description: "Put your public shipping log on your domain." },
  { icon: <BarChart3 size={16} />, title: "Premium shipping analytics", description: "Compare 30, 90, and 365-day trends, track consistency and weekly pace, explore category and weekday patterns, and export your history." },
  { icon: <Award size={16} />, title: "Builder levels & milestones", description: "Earn XP and unlock badges as your body of work grows." },
  { icon: <TreePine size={16} />, title: "Proof Tree canopy report", description: "See month-over-month growth, your strongest work lane, and the next milestone taking shape." },
  { icon: <Palette size={16} />, title: "More card themes", description: "Make the share card feel like your work." },
  { icon: <Sparkles size={16} />, title: "No Proof branding", description: "Your page. Your name. Nothing extra." },
];

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const params = await searchParams;
  return (
    <AppShell>
      <main className="mx-auto max-w-[1040px] px-5 py-12 sm:px-8 sm:py-16">
        <header className="mx-auto max-w-[650px] text-center">
          <p className="text-xs font-medium text-muted">SIMPLE PLANS</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">Ship for free. Go Pro when it fits.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">The habit stays yours. Pro gives your work a little more room to travel.</p>
        </header>
        {params.billing === "cancelled" && <p className="mx-auto mt-6 max-w-xl rounded-control border border-white/[0.08] bg-surface p-3 text-center text-xs text-muted" role="status">Checkout was cancelled. Your free account is still here when you need it.</p>}
        <div className="mx-auto mt-10 grid max-w-[760px] gap-4 md:grid-cols-2">
          <section className="rounded-card border border-white/[0.08] bg-surface p-6 sm:p-7">
            <p className="text-sm font-medium">Free</p>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.07em]">$0<span className="ml-1 text-sm font-normal tracking-normal text-muted">/ forever</span></p>
            <p className="mt-2 text-xs text-muted">For your next small step.</p>
            <Link className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-white/[0.1] text-sm font-medium transition-colors hover:bg-white/[0.04]" href="/login">Start building free</Link>
            <ul className="mt-7 space-y-3 text-xs text-muted">{["Daily shipping log", "Growing Proof tree", "Public profile", "Share cards"].map((feature) => <li className="flex items-center gap-2.5" key={feature}><Check className="text-foreground" size={14} />{feature}</li>)}</ul>
          </section>

          <section className="relative rounded-card border border-white/[0.1] bg-[#111113] p-6 sm:p-7">
            <span className="absolute right-5 top-5 rounded-full border border-white/[0.08] bg-elevated px-2.5 py-1 text-[10px] font-medium text-muted">FOR THE LONG GAME</span>
            <p className="text-sm font-medium">Pro</p>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.07em]">$8<span className="ml-1 text-sm font-normal tracking-normal text-muted">/ month</span></p>
            <p className="mt-1 text-xs text-muted">Or $60 per year. Two months on us.</p>
            <div className="mt-6 grid gap-2"><BillingButton plan="monthly" /><BillingButton plan="yearly" /></div>
            <ul className="mt-6 space-y-3 text-xs text-muted">{proFeatures.map((feature) => <li className="flex items-start gap-2.5" key={feature.title}><span className="mt-0.5 text-foreground">{feature.icon}</span><span><span className="font-medium text-foreground">{feature.title}</span><span className="mt-0.5 block leading-5">{feature.description}</span></span></li>)}</ul>
          </section>
        </div>
        <section className="mx-auto mt-8 max-w-[760px] rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><h2 className="text-sm font-medium">No pressure to upgrade.</h2><p className="mt-1 text-xs text-muted">Proof is useful on day one. Pro is here for when you want more.</p></div>
            <Link className="inline-flex min-h-11 items-center gap-2 text-xs text-muted transition-colors hover:text-foreground" href="/">Back to your log <ArrowRight size={14} /></Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
