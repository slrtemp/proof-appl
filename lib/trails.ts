import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Ship } from "@/lib/types";

export interface Trail {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string;
  created_at: string;
}

export function slugifyTrailTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)
    .replace(/-+$/g, "");
  return slug || "trail";
}

// Public trails of a profile with the number of ships in each.
export const getProfileTrails = cache(async (userId: string): Promise<(Trail & { shipCount: number })[]> => {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data: trails, error } = await supabase
    .from("trails")
    .select("id,user_id,slug,title,description,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Could not load Proof trails.", error);
    return [];
  }
  if (!trails?.length) return [];
  const { data: links, error: linksError } = await supabase
    .from("trail_ships")
    .select("trail_id")
    .in("trail_id", trails.map((trail) => trail.id))
    .limit(5000);
  if (linksError) console.error("Could not load Proof trail ships.", linksError);
  const counts = new Map<string, number>();
  for (const link of links ?? []) counts.set(link.trail_id, (counts.get(link.trail_id) ?? 0) + 1);
  return trails.map((trail) => ({ ...(trail as Trail), shipCount: counts.get(trail.id) ?? 0 }));
});

export async function getTrailWithShips(userId: string, slug: string): Promise<{ trail: Trail; ships: Ship[] } | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: trail, error } = await supabase
    .from("trails")
    .select("id,user_id,slug,title,description,created_at")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("Could not load the Proof trail.", error);
    throw new Error("Could not load this trail.");
  }
  if (!trail) return null;
  const { data: links, error: linksError } = await supabase.from("trail_ships").select("ship_id").eq("trail_id", trail.id).limit(1000);
  if (linksError) {
    console.error("Could not load the Proof trail ships.", linksError);
    throw new Error("Could not load this trail.");
  }
  const shipIds = (links ?? []).map((link) => link.ship_id);
  if (!shipIds.length) return { trail: trail as Trail, ships: [] };
  const { data: ships, error: shipsError } = await supabase
    .from("ships")
    .select("id,user_id,body,category,link,shipped_on,created_at")
    .in("id", shipIds)
    .order("shipped_on", { ascending: false });
  if (shipsError) {
    console.error("Could not load the Proof trail timeline.", shipsError);
    throw new Error("Could not load this trail.");
  }
  return { trail: trail as Trail, ships: (ships ?? []) as Ship[] };
}
