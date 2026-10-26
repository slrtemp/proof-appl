import { Dashboard } from "@/components/dashboard";
import { AppShell } from "@/components/app-shell";
import { createDemoShips, DEMO_PROFILE } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { getBillingNotice, hasProAccess, needsBillingPortal, type SubscriptionRecord } from "@/lib/billing";
import type { Profile, Ship } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [{ data: profile, error: profileError }, { data: ships, error: shipsError }] = await Promise.all([
        supabase.from("profiles").select("id,username,full_name,tagline,bio,location,website,avatar_url,is_verified,created_at").eq("id", user.id).single(),
        supabase.from("ships").select("id,user_id,body,category,link,shipped_on,created_at").eq("user_id", user.id).order("shipped_on", { ascending: false }).limit(400),
      ]);
      if (profileError) {
        console.error("Could not load the signed-in Proof profile.", profileError);
        throw new Error("Could not load your Proof profile.");
      }
      if (shipsError) {
        console.error("Could not load the signed-in Proof ships.", shipsError);
        throw new Error("Could not load your shipping log.");
      }
      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("plan,billing_interval,founder_access,status,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (subscriptionError) {
        console.error("Could not load the signed-in Proof plan.", subscriptionError);
        throw new Error("Could not load your Proof plan.");
      }
      const typedSubscription = subscription as SubscriptionRecord | null;
      const isPro = hasProAccess(typedSubscription);
      return (
        <AppShell>
          <Dashboard
            billingNotice={getBillingNotice(typedSubscription)}
            demoMode={false}
            demoProfile={{ ...(profile as Profile), is_pro: isPro }}
            hasBilling={needsBillingPortal(typedSubscription)}
            initialShips={(ships ?? []) as Ship[]}
            isPro={isPro}
          />
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <Dashboard demoMode initialShips={createDemoShips()} demoProfile={DEMO_PROFILE} isPro={false} />
    </AppShell>
  );
}
