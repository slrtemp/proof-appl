import { cache } from "react";

import { DEMO_PROFILE, DEMO_SHIPS } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Ship } from "@/lib/types";

export const getPublicProfile = cache(async (username: string): Promise<{ profile: Profile; ships: Ship[] } | null> => {
  if (username.toLowerCase() === DEMO_PROFILE.username) {
    return { profile: DEMO_PROFILE, ships: DEMO_SHIPS };
  }

  const supabase = await createClient();
  if (!supabase) return null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,username,full_name,tagline,bio,location,website,avatar_url,is_verified,created_at")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (profileError) {
    console.error("Could not load public Proof profile.", profileError);
    throw new Error("Could not load this public profile.");
  }
  if (!profile) return null;

  const { data: isPro, error: billingError } = await supabase.rpc("is_public_pro_profile", {
    profile_username: username,
  });
  if (billingError) {
    console.error("Could not load the public Proof billing status.", billingError);
    throw new Error("Could not load this public profile.");
  }

  const { data: ships, error: shipsError } = await supabase
    .from("ships")
    .select("id,user_id,body,category,link,shipped_on,created_at")
    .eq("user_id", profile.id)
    .order("shipped_on", { ascending: false })
    .limit(1000);

  if (shipsError) {
    console.error("Could not load public Proof ships.", shipsError);
    throw new Error("Could not load this shipping timeline.");
  }
  return { profile: { ...profile, is_pro: isPro } as Profile, ships: ships ?? [] };
});
