import WelcomePage from "@/app/welcome/page";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { getBillingNotice, hasProAccess, needsBillingPortal, type SubscriptionRecord } from "@/lib/billing";
import type { Profile, Ship } from "@/lib/types";
import { getDateKey } from "@/lib/dates";

export default async function HomePage() {
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [
        { data: profile, error: profileError },
        { data: ships, error: shipsError },
        { data: restDays, error: restDaysError },
      ] = await Promise.all([
        supabase.from("profiles").select("id,username,full_name,tagline,bio,location,website,avatar_url,is_verified,timezone,created_at").eq("id", user.id).single(),
        supabase.from("ships").select("id,user_id,body,category,link,shipped_on,created_at").eq("user_id", user.id).order("shipped_on", { ascending: false }).limit(400),
        supabase.from("rest_days").select("rest_on").eq("user_id", user.id).order("rest_on", { ascending: false }).limit(1000),
      ]);
      if (profileError) {
        console.error("Could not load the signed-in Proof profile.", profileError);
        throw new Error("Could not load your Proof profile.");
      }
      if (shipsError) {
        console.error("Could not load the signed-in Proof ships.", shipsError);
        throw new Error("Could not load your shipping log.");
      }
      if (restDaysError) {
        console.error("Could not load the signed-in Proof rest days.", restDaysError);
        throw new Error("Could not load your rest days.");
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
      const timezone = profile.timezone || "UTC";
      return (
        <AppShell>
          <Dashboard
            billingNotice={getBillingNotice(typedSubscription)}
            demoMode={false}
            demoProfile={{ ...(profile as Profile), is_pro: isPro }}
            hasBilling={needsBillingPortal(typedSubscription)}
            initialShips={(ships ?? []) as Ship[]}
            initialRestDays={(restDays ?? []).map((restDay) => restDay.rest_on)}
            isPro={isPro}
            timeZone={timezone}
            todayKey={getDateKey(new Date(), timezone)}
          />
        </AppShell>
      );
    }
  }

  return <WelcomePage />;
}
