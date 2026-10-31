import { NextRequest } from "next/server";

import { buildActivityMapSvg } from "@/lib/embed-map";
import { getDateKey } from "@/lib/dates";
import { getPublicProfile } from "@/lib/profiles";
import { getSiteUrl } from "@/lib/site-url";
import { getStreakStats } from "@/lib/streaks";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

// Embeddable activity map. Use ?theme=light for light backgrounds (default is dark).
export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await context.params;
  const username = rawUsername.replace(/\.svg$/i, "");
  if (!/^[a-zA-Z0-9_-]{2,32}$/.test(username)) return new Response("Invalid username.", { status: 400 });

  const data = await getPublicProfile(username.toLowerCase());
  if (!data) return new Response("Public profile not found.", { status: 404, headers: { "Cache-Control": "public, s-maxage=60" } });

  const { profile, ships, restDays } = data;
  const timeZone = profile.timezone || "UTC";
  const now = new Date();
  const stats = getStreakStats(ships, now, restDays, timeZone);
  const svg = buildActivityMapSvg({
    username: profile.username,
    shipDates: ships.map((ship) => ship.shipped_on),
    today: getDateKey(now, timeZone),
    total: stats.total,
    currentStreak: stats.current,
    profileUrl: `${getSiteUrl()}/${encodeURIComponent(profile.username)}`,
    theme: request.nextUrl.searchParams.get("theme") === "light" ? "light" : "dark",
  });
  return new Response(svg, { headers: SVG_HEADERS });
}
