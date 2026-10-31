import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmbedSnippet } from "@/components/embed-snippet";
import { TrailManager } from "@/components/trail-manager";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Trails and embed" };

export default async function TrailsSettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile, error: profileError }, { data: trails, error: trailsError }, { data: ships, error: shipsError }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.from("trails").select("id,slug,title,description").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("ships").select("id,body,shipped_on").eq("user_id", user.id).order("shipped_on", { ascending: false }).limit(60),
  ]);
  if (profileError || trailsError || shipsError) {
    console.error("Could not load Proof trails.", profileError || trailsError || shipsError);
    throw new Error("Could not load your trails.");
  }

  const shipIds = (ships ?? []).map((ship) => ship.id);
  const { data: links } = shipIds.length
    ? await supabase.from("trail_ships").select("ship_id,trail_id").in("ship_id", shipIds)
    : { data: [] as { ship_id: string; trail_id: string }[] };
  const trailByShip = new Map((links ?? []).map((link) => [link.ship_id, link.trail_id]));

  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <header className="mb-7">
          <p className="text-xs text-muted"><Link className="hover:text-foreground" href="/settings">Settings</Link> / Trails and embed</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Show your work off.</h1>
          <p className="mt-2 text-sm text-muted">Group ships into project trails and add your activity map to your README or website.</p>
        </header>
        <div className="space-y-10">
          <EmbedSnippet origin={getSiteUrl()} username={profile.username} />
          <TrailManager
            initialShips={(ships ?? []).map((ship) => ({ ...ship, trailId: trailByShip.get(ship.id) ?? null }))}
            initialTrails={trails ?? []}
            username={profile.username}
          />
        </div>
      </main>
    </AppShell>
  );
}
