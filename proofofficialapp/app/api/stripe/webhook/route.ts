import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = createAdminClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !admin || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed.", error);
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;
  if (event.type.startsWith("customer.subscription.")) {
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const userId = subscription.metadata.user_id;
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const { data: existing, error } = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (error) {
        console.error("Could not resolve the Supabase user for Stripe subscription.", error);
        return NextResponse.json({ error: "Subscription customer could not be resolved." }, { status: 500 });
      }
      resolvedUserId = existing?.user_id;
    }

    if (!resolvedUserId) {
      console.error("Stripe subscription is missing its Supabase user mapping.", { eventId: event.id });
      return NextResponse.json({ error: "Subscription user could not be resolved." }, { status: 400 });
    }

    const isPro = subscription.status === "active" || subscription.status === "trialing";
    const { error: subscriptionError } = await admin.from("subscriptions").upsert({
      user_id: resolvedUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id ?? null,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (subscriptionError) {
      console.error("Could not update the Proof subscription.", subscriptionError);
      return NextResponse.json({ error: "Subscription status could not be saved." }, { status: 500 });
    }

    const { data: profile, error: founderError } = await admin
      .from("profiles")
      .select("is_founder")
      .eq("id", resolvedUserId)
      .single();
    if (founderError) {
      console.error("Could not check founder Pro access.", founderError);
      return NextResponse.json({ error: "Founder Pro access could not be checked." }, { status: 500 });
    }

    const { error: profileError } = await admin.from("profiles").update({ is_pro: isPro || profile.is_founder }).eq("id", resolvedUserId);
    if (profileError) {
      console.error("Could not synchronize the Proof Pro flag.", profileError);
      return NextResponse.json({ error: "Pro access could not be synchronized." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
