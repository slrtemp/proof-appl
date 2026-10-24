import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!stripe || !supabase || !admin) return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in before starting a subscription." }, { status: 401 });

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
    ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
    : process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "This billing plan is not configured." }, { status: 503 });

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Could not load the Stripe customer for checkout.", error);
    return NextResponse.json({ error: "Billing details could not be loaded." }, { status: 500 });
  }
  const customerId = subscription?.stripe_customer_id;

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/settings?billing=success`,
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
