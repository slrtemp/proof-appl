import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Account deletion is not configured." }, { status: 503 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });

  let payload: { confirmation?: unknown };
  try {
    payload = await request.json() as { confirmation?: unknown };
  } catch {
    return NextResponse.json({ error: "Confirm account deletion to continue." }, { status: 400 });
  }
  if (payload.confirmation !== "DELETE") {
    return NextResponse.json({ error: 'Type "DELETE" to confirm account deletion.' }, { status: 400 });
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select("stripe_customer_id,stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (subscriptionError) {
    console.error("Could not load billing details for account deletion.", subscriptionError);
    return NextResponse.json({ error: "Billing details could not be checked." }, { status: 500 });
  }

  if (subscription?.stripe_subscription_id) {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Billing is not configured; contact support before deleting this account." }, { status: 503 });
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (stripeError) {
      console.error("Could not cancel the Proof subscription before account deletion.", stripeError);
      return NextResponse.json({ error: "Your subscription could not be cancelled. Please contact support before deleting your account." }, { status: 502 });
    }
  }
  if (subscription?.stripe_customer_id) {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Billing is not configured; contact support before deleting this account." }, { status: 503 });
    try {
      await stripe.customers.del(subscription.stripe_customer_id);
    } catch (stripeError) {
      console.error("Could not delete the Stripe customer before account deletion.", stripeError);
      return NextResponse.json({ error: "Your billing customer could not be removed. Please contact support before deleting your account." }, { status: 502 });
    }
  }

  const { data: avatarFiles, error: avatarListError } = await admin.storage.from("avatars").list(user.id);
  if (avatarListError) {
    console.error("Could not load profile photo files during account deletion.", avatarListError);
    return NextResponse.json({ error: "Account files could not be removed." }, { status: 500 });
  }
  if (avatarFiles?.length) {
    const { error: avatarDeleteError } = await admin.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    if (avatarDeleteError) {
      console.error("Could not remove profile photo files during account deletion.", avatarDeleteError);
      return NextResponse.json({ error: "Account files could not be removed." }, { status: 500 });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("Could not delete the Proof auth user.", deleteError);
    return NextResponse.json({ error: "Your account could not be deleted. Please contact support." }, { status: 500 });
  }
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) console.error("Could not clear the session after deleting the Proof account.", signOutError);
  return NextResponse.json({ success: true });
}
