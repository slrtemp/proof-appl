"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BarChart3, Check, Globe2, Palette, Sparkles, TreePine } from "lucide-react";

import { BillingButton, PortalButton } from "@/components/billing-button";
import { Button } from "@/components/ui/button";

const proFeatures = [
  { icon: <Globe2 size={16} />, title: "Your own domain", description: "Put your public shipping log on your domain." },
  { icon: <BarChart3 size={16} />, title: "Premium shipping analytics", description: "Compare 30, 90, and 365-day trends, track consistency and weekly pace, explore category and weekday patterns, and export your history." },
  { icon: <Award size={16} />, title: "Builder levels & milestones", description: "Earn XP and unlock badges as your body of work grows." },
  { icon: <TreePine size={16} />, title: "Proof Tree canopy report", description: "See month-over-month growth, your strongest work lane, and the next milestone taking shape." },
  { icon: <Palette size={16} />, title: "More card themes", description: "Make the share card feel like your work." },
  { icon: <Sparkles size={16} />, title: "No Proof branding", description: "Your page. Your name. Nothing extra." },
];

type BillingPlan = "monthly" | "yearly";

export function PricingPlans({
  signedIn,
  isPro,
  initialPlan,
  billingState,
  checkoutPlan,
  billingNotice,
  hasBilling,
}: {
  signedIn: boolean;
  isPro: boolean;
  initialPlan: BillingPlan;
  billingState?: string;
  checkoutPlan?: string;
  billingNotice?: string | null;
  hasBilling: boolean;
}) {
  const [plan, setPlan] = useState<BillingPlan>(initialPlan);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (billingState !== "success" || isPro || refreshAttempts >= 5) return;
    const timer = window.setTimeout(() => {
      setRefreshAttempts((attempts) => attempts + 1);
      router.refresh();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [billingState, isPro, refreshAttempts, router]);

  const autoStart = checkoutPlan === "monthly" || checkoutPlan === "yearly"
    ? checkoutPlan === plan
    : false;

  return (
    <>
      {billingState === "cancelled" && <p className="mx-auto mt-6 max-w-xl rounded-control border border-white/[0.08] bg-surface p-3 text-center text-xs text-muted" role="status">Checkout was cancelled. Your free account is still here when you need it.</p>}
      {billingState === "success" && (
        <p className="mx-auto mt-6 max-w-xl rounded-control border border-white/[0.08] bg-surface p-3 text-center text-xs text-muted" role="status">
          {isPro ? "Welcome to Proof Pro. Your plan is active." : refreshAttempts < 5 ? "Payment received. We’re confirming your Pro access…" : "Payment was received. Your plan is still syncing; refresh in a moment or contact support if it does not update."}
        </p>
      )}
      {billingNotice && <p className="mx-auto mt-4 max-w-xl rounded-control border border-amber-200/10 bg-amber-200/[0.04] p-3 text-center text-xs leading-5 text-muted" role="status">{billingNotice}</p>}

      <div className="mx-auto mt-10 grid max-w-[760px] gap-4 md:grid-cols-2">
        <section className="rounded-card border border-white/[0.08] bg-surface p-6 sm:p-7">
          <p className="text-sm font-medium">Free</p>
          <p className="mt-5 text-4xl font-semibold tracking-[-0.07em]">$0<span className="ml-1 text-sm font-normal tracking-normal text-muted">/ forever</span></p>
          <p className="mt-2 text-xs text-muted">For your next small step.</p>
          {signedIn && !isPro
            ? <Button className="mt-6 w-full" disabled variant="secondary">{hasBilling ? "Billing issue" : "Current plan"}</Button>
            : isPro
              ? <p className="mt-6 min-h-11 py-3 text-center text-xs text-muted">Free essentials are always included.</p>
              : <Link className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-white/[0.1] text-sm font-medium transition-colors hover:bg-white/[0.04]" href="/login">Start free</Link>}
          <ul className="mt-7 space-y-3 text-xs text-muted">{["Daily shipping log", "Growing Proof tree", "Public profile", "Share cards"].map((feature) => <li className="flex items-center gap-2.5" key={feature}><Check className="text-foreground" size={14} />{feature}</li>)}</ul>
        </section>

        <section className="relative rounded-card border border-white/[0.1] bg-[#111113] p-6 sm:p-7">
          <span className="absolute right-5 top-5 rounded-full border border-white/[0.08] bg-elevated px-2.5 py-1 text-[10px] font-medium text-muted">FOR THE LONG GAME</span>
          <p className="text-sm font-medium">Pro</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-[-0.07em]">${plan === "monthly" ? "8" : "60"}</span>
            <span className="text-sm text-muted">/ {plan === "monthly" ? "month" : "year"}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{plan === "yearly" ? "Billed yearly · save 37% compared with monthly." : "Billed monthly."}</p>
          <div className="mt-5 flex items-center gap-1 rounded-control border border-white/[0.08] bg-background p-1" aria-label="Billing frequency">
            {(["monthly", "yearly"] as const).map((option) => (
              <button
                aria-pressed={plan === option}
                className={`min-h-9 flex-1 rounded px-3 text-xs font-medium transition-colors ${plan === option ? "bg-elevated text-foreground" : "text-muted hover:text-foreground"}`}
                key={option}
                onClick={() => setPlan(option)}
                type="button"
              >
                {option === "monthly" ? "Monthly · $8" : "Yearly · $60 · save 37%"}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {hasBilling ? <PortalButton /> : isPro ? <Button className="w-full" disabled variant="secondary">Pro active</Button> : <BillingButton autoStart={autoStart} plan={plan} signedIn={signedIn} />}
          </div>
          <p className="mt-2 text-center text-[10px] text-muted">{hasBilling ? "Manage or update your existing subscription." : signedIn ? "Cancel anytime from your billing portal." : "You’ll sign in before checkout. Cancel anytime."}</p>
          <ul className="mt-6 space-y-3 text-xs text-muted">{proFeatures.map((feature) => <li className="flex items-start gap-2.5" key={feature.title}><span className="mt-0.5 text-foreground">{feature.icon}</span><span><span className="font-medium text-foreground">{feature.title}</span><span className="mt-0.5 block leading-5">{feature.description}</span></span></li>)}</ul>
        </section>
      </div>
    </>
  );
}
