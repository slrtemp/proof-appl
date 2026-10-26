import type { MetadataRoute } from "next";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  const urls: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/welcome`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/support`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/alex-morgan`, changeFrequency: "weekly", priority: 0.6 },
  ];
  const supabase = await createClient();
  if (!supabase) return urls;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("username,updated_at")
    .eq("is_public", true)
    .limit(5000);
  if (error) {
    console.error("Could not load public profiles for the sitemap.", error);
    throw new Error("Could not generate the sitemap.");
  }
  for (const profile of profiles ?? []) {
    urls.push({
      url: `${origin}/${encodeURIComponent(profile.username)}`,
      lastModified: profile.updated_at,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }
  return urls;
}
