import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { DEMO_PROFILE } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import { getBillingNotice, getUserSubscription, hasProAccess, needsBillingPortal } from "@/lib/billing";
import { ReminderSettings } from "@/components/reminder-settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <AppShell>
        <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
          <SettingsHeading />
          <SettingsForm initial={{ id: null, username: DEMO_PROFILE.username, fullName: DEMO_PROFILE.full_name, tagline: DEMO_PROFILE.tagline, bio: DEMO_PROFILE.bio, location: DEMO_PROFILE.location, website: DEMO_PROFILE.website ?? "", avatarUrl: DEMO_PROFILE.avatar_url, email: "", isPro: false }} />
          <p className="mt-4 text-center text-xs text-muted">Demo settings save to this browser. <Link className="text-foreground underline underline-offset-4" href="/login">Sign in</Link> to keep settings with your account.</p>
        </main>
      </AppShell>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,username,full_name,tagline,bio,location,website,avatar_url,is_public")
    .eq("id", user.id)
    .single();
  if (error) {
    console.error("Could not load Proof account settings.", error);
    throw new Error("Could not load account settings.");
  }
  const subscription = await getUserSubscription(user.id);
  const { data: reminder, error: reminderError } = await supabase
    .from("account_reminders")
    .select("enabled,recap_enabled,goal")
    .eq("user_id", user.id)
    .maybeSingle();
  if (reminderError) {
    console.error("Could not load Proof reminder preferences.", reminderError);
    throw new Error("Could not load reminder preferences.");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <SettingsHeading />
        <SettingsForm initial={{ id: profile.id, username: profile.username, fullName: profile.full_name, tagline: profile.tagline ?? "", bio: profile.bio ?? "", location: profile.location ?? "", website: profile.website ?? "", avatarUrl: profile.avatar_url, email: user.email ?? "", isPro: hasProAccess(subscription), isPublic: profile.is_public, hasBilling: needsBillingPortal(subscription), billingNotice: getBillingNotice(subscription) }} />
        <ReminderSettings initialEnabled={reminder?.enabled ?? false} initialGoal={reminder?.goal ?? ""} initialRecapEnabled={reminder?.recap_enabled ?? false} />
        <section className="mt-5 border-t border-white/[0.08] pt-5">
          <h3 className="text-sm font-medium">Trails and embed</h3>
          <p className="mt-1 text-xs leading-5 text-muted">Group ships into project trails and add your activity map to a README or website.</p>
          <Link className="mt-3 inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground" href="/settings/trails">Open trails and embed</Link>
        </section>
      </main>
    </AppShell>
  );
}

function SettingsHeading() {
  return <header className="mb-7"><p className="text-xs text-muted">Proof / Settings</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Your corner of the internet.</h1><p className="mt-2 text-sm text-muted">A few details to make your shipping log yours.</p></header>;
}
