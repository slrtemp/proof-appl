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
  if (authError || !user) return NextResponse.json({ error: "Sign in to manage your billing." }, { status: 401 });

  const { data: subscription, error } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Could not load the Stripe customer for the billing portal.", error);
    return NextResponse.json({ error: "Billing details could not be loaded." }, { status: 500 });
  }
  if (!subscription?.stripe_customer_id) return NextResponse.json({ error: "No billing customer was found for this account." }, { status: 404 });

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  let portal: Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>;
  try {
    portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/settings`,
    });
  } catch (portalError) {
    console.error("Could not create a Stripe customer portal session.", portalError);
    return NextResponse.json({ error: "The billing portal could not be opened. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ url: portal.url });
}
