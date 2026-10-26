import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

function getPlanDetails(subscription: Stripe.Subscription): {
  plan: "free" | "pro";
  billingInterval: "monthly" | "yearly" | null;
} {
  const price = subscription.items.data[0]?.price;
  const priceId = price?.id;
  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY || process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  const billingInterval = (yearlyPriceId && priceId === yearlyPriceId)
    ? "yearly"
    : (monthlyPriceId && priceId === monthlyPriceId)
      ? "monthly"
      : null;

  return {
    plan: ["active", "trialing", "past_due"].includes(subscription.status)
      || (subscription.status === "canceled" && subscription.current_period_end * 1000 > Date.now())
      ? "pro"
      : "free",
    billingInterval,
  };
}

async function syncSubscription(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  subscription: Stripe.Subscription,
  eventCreated: number,
  knownUserId?: string | null,
): Promise<void> {
  const customerId = getCustomerId(subscription.customer);
  let userId = knownUserId || subscription.metadata.user_id;

  if (!userId) {
    const { data: existing, error } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (error) throw new Error(`Could not resolve the subscription owner: ${error.message}`);
    userId = existing?.user_id;
  }
  if (!userId) throw new Error("The subscription is missing its Proof account mapping.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_founder")
    .eq("id", userId)
    .single();
  if (profileError) throw new Error(`Could not check founder access: ${profileError.message}`);

  const price = subscription.items.data[0]?.price;
  const planDetails = getPlanDetails(subscription);
  if (!planDetails.billingInterval) {
    throw new Error(`Stripe returned an unknown Proof price: ${price?.id ?? "missing"}.`);
  }

  const { data: existing, error: existingError } = await admin
    .from("subscriptions")
    .select("last_event_created")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw new Error(`Could not check subscription event order: ${existingError.message}`);
  if (existing && Number(existing.last_event_created) > eventCreated) return;

  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan: profile.is_founder ? "pro" : planDetails.plan,
    billing_interval: planDetails.billingInterval,
    founder_access: profile.is_founder,
    status: subscription.status,
    price_id: price?.id ?? null,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    last_event_created: eventCreated,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) throw new Error(`Could not save the Proof subscription: ${error.message}`);
}

async function processEvent(
  event: Stripe.Event,
  stripe: Stripe,
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription" || !session.subscription) return;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(admin, subscription, event.created, session.client_reference_id ?? session.metadata?.user_id);
    return;
  }

  if (event.type.startsWith("customer.subscription.")) {
    await syncSubscription(admin, event.data.object as Stripe.Subscription, event.created);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    if (!invoice.subscription) return;
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscription(admin, subscription, event.created);
  }
}

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

  const { data: processedEvent, error: lookupError } = await admin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (lookupError) {
    console.error("Could not check Stripe webhook idempotency.", lookupError);
    return NextResponse.json({ error: "Webhook event status could not be checked." }, { status: 500 });
  }
  if (processedEvent) return NextResponse.json({ received: true, duplicate: true });

  try {
    await processEvent(event, stripe, admin);
  } catch (error) {
    console.error("Could not process the Proof Stripe webhook.", { eventId: event.id, error });
    return NextResponse.json({ error: "The billing event could not be processed." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  });
  if (insertError && insertError.code !== "23505") {
    console.error("Could not record the processed Stripe webhook.", insertError);
    return NextResponse.json({ error: "The billing event could not be recorded." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
