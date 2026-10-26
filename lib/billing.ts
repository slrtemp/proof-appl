import { createClient } from "@/lib/supabase/server";

export type SubscriptionRecord = {
  plan: "free" | "pro";
  billing_interval?: "monthly" | "yearly" | null;
  founder_access?: boolean;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export function hasProAccess(subscription: SubscriptionRecord | null, now = Date.now()): boolean {
  if (!subscription || subscription.plan !== "pro") return false;
  if (subscription.founder_access) return true;
  const periodEnd = subscription.current_period_end ? Date.parse(subscription.current_period_end) : 0;
  if (subscription.status === "active" || subscription.status === "trialing") return periodEnd > now;
  if (subscription.status === "past_due") return periodEnd + 7 * 24 * 60 * 60 * 1000 > now;
  return subscription.status === "canceled" && periodEnd > now;
}

export function needsBillingPortal(subscription: SubscriptionRecord | null): boolean {
  return Boolean(
    subscription
    && subscription.stripe_subscription_id
    && (hasProAccess(subscription)
      || ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(subscription.status)),
  );
}

export function getBillingNotice(subscription: SubscriptionRecord | null): string | null {
  if (!subscription) return null;
  if (subscription.status === "past_due") {
    return hasProAccess(subscription)
      ? "Your payment needs attention. Pro remains available during a short billing grace period; update your payment method to keep it."
      : "Your payment is past due and the grace period has ended. Update your payment method to restore Pro.";
  }
  if ((subscription.status === "canceled" || subscription.cancel_at_period_end) && hasProAccess(subscription)) {
    return "Your subscription is set to end at the close of this billing period. Pro remains available until then.";
  }
  return null;
}

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan,billing_interval,founder_access,status,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not load the Proof subscription.", error);
    throw new Error("Could not load your billing status.");
  }

  return data as SubscriptionRecord | null;
}
