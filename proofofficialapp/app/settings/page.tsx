import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { DEMO_PROFILE } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

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
    .select("id,username,full_name,tagline,bio,location,website,avatar_url,is_pro")
    .eq("id", user.id)
    .single();
  if (error) {
    console.error("Could not load Proof account settings.", error);
    throw new Error("Could not load account settings.");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <SettingsHeading />
        <SettingsForm initial={{ id: profile.id, username: profile.username, fullName: profile.full_name, tagline: profile.tagline ?? "", bio: profile.bio ?? "", location: profile.location ?? "", website: profile.website ?? "", avatarUrl: profile.avatar_url, email: user.email ?? "", isPro: profile.is_pro }} />
      </main>
    </AppShell>
  );
}

function SettingsHeading() {
  return <header className="mb-7"><p className="text-xs text-muted">Proof / Settings</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Your corner of the internet.</h1><p className="mt-2 text-sm text-muted">A few details to make your shipping log yours.</p></header>;
}
