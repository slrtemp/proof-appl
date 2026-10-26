import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { hasProAccess, needsBillingPortal, type SubscriptionRecord } from "@/lib/billing";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Sign-in is not configured yet." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in before starting a subscription." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });

  let body: { plan?: unknown };
  try {
    body = await request.json() as { plan?: unknown };
  } catch {
    return NextResponse.json({ error: "Choose a valid billing plan." }, { status: 400 });
  }
  if (body.plan !== "monthly" && body.plan !== "yearly") {
    return NextResponse.json({ error: "Choose monthly or yearly billing." }, { status: 400 });
  }

  const priceId = body.plan === "monthly"
    ? process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRO_MONTHLY_PRICE_ID
    : process.env.STRIPE_PRICE_YEARLY || process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "This billing plan is not configured." }, { status: 503 });

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("plan,billing_interval,founder_access,status,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Could not load the Stripe customer for checkout.", error);
    return NextResponse.json({ error: "Billing details could not be loaded." }, { status: 500 });
  }
  const typedSubscription = subscription as SubscriptionRecord | null;
  const origin = getSiteUrl();

  if (typedSubscription?.founder_access && hasProAccess(typedSubscription) && !typedSubscription.stripe_subscription_id) {
    return NextResponse.json({ error: "Proof Pro is already included with this account." }, { status: 409 });
  }

  if (typedSubscription && needsBillingPortal(typedSubscription)) {
    if (!typedSubscription.stripe_customer_id) {
      return NextResponse.json({ error: "Your billing customer could not be found." }, { status: 500 });
    }
    try {
      const portal = await stripe.billingPortal.sessions.create({
        customer: typedSubscription.stripe_customer_id,
        return_url: `${origin}/settings`,
      });
      return NextResponse.json({ url: portal.url, alreadySubscribed: true });
    } catch (portalError) {
      console.error("Could not open the billing portal for an existing Proof subscriber.", portalError);
      return NextResponse.json({ error: "Your subscription already exists, but billing settings could not be opened." }, { status: 502 });
    }
  }

  let customerId = typedSubscription?.stripe_customer_id ?? null;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        ...(user.email ? { email: user.email } : {}),
        metadata: { user_id: user.id },
      }, { idempotencyKey: `proof-customer-${user.id}` });
      customerId = customer.id;
    } catch (customerError) {
      console.error("Could not create a Stripe customer for Proof checkout.", customerError);
      return NextResponse.json({ error: "Your billing account could not be created. Please try again." }, { status: 502 });
    }
  }

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/pricing?billing=success`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      allow_promotion_codes: true,
    });
  } catch (error) {
    console.error("Could not create a Stripe checkout session.", error);
    return NextResponse.json({ error: "Secure checkout could not be started. Please try again." }, { status: 502 });
  }

  if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
