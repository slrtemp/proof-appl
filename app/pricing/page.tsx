import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PricingPlans } from "@/components/pricing-plans";
import { getBillingNotice, getUserSubscription, hasProAccess, needsBillingPortal } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

type PricingSearchParams = {
  billing?: string;
  checkout?: string;
  plan?: string;
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<PricingSearchParams> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const subscription = user ? await getUserSubscription(user.id) : null;
  const isPro = hasProAccess(subscription);
  const selectedPlan = params.checkout === "monthly" || params.checkout === "yearly"
    ? params.checkout
    : params.plan === "monthly"
      ? "monthly"
      : "yearly";

  return (
    <AppShell>
      <main className="mx-auto max-w-[1040px] px-5 py-12 sm:px-8 sm:py-16">
        <header className="mx-auto max-w-[650px] text-center">
          <p className="text-xs font-medium text-muted">SIMPLE PLANS</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">Ship for free. Go Pro when it fits.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">The habit stays yours. Pro gives your work a little more room to travel.</p>
        </header>
        <PricingPlans
          billingNotice={getBillingNotice(subscription)}
          billingState={params.billing}
          hasBilling={needsBillingPortal(subscription)}
          initialPlan={selectedPlan}
          isPro={isPro}
          signedIn={Boolean(user)}
        />
        <section className="mx-auto mt-8 max-w-[760px] rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><h2 className="text-sm font-medium">No pressure to upgrade.</h2><p className="mt-1 text-xs text-muted">Proof is useful on day one. Pro is here for when you want more.</p></div>
            <Link className="inline-flex min-h-11 items-center gap-2 text-xs text-muted transition-colors hover:text-foreground" href="/"><span>Back to your log</span><ArrowRight size={14} /></Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
