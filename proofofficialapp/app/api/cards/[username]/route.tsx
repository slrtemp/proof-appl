import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { DEMO_PROFILE, DEMO_SHIPS } from "@/lib/demo";
import { getPublicProfile } from "@/lib/profiles";
import { getStreakStats } from "@/lib/streaks";

export const runtime = "edge";

export async function GET(request: NextRequest, context: { params: Promise<{ username: string }> }) {
  const { username } = await context.params;
  if (!/^[a-zA-Z0-9_-]{2,32}$/.test(username)) return new Response("Invalid username.", { status: 400 });
  const format = request.nextUrl.searchParams.get("format") === "portrait" ? "portrait" : "landscape";
  const demo = username.toLowerCase() === DEMO_PROFILE.username;
  const data = demo ? { profile: DEMO_PROFILE, ships: DEMO_SHIPS } : await getPublicProfile(username);
  if (!data) return new Response("Public profile not found.", { status: 404 });

  const { profile, ships } = data;
  const profileUrl = new URL(`/${profile.username}`, request.nextUrl.origin).toString();
  const stats = getStreakStats(ships);
  const latestShip = [...ships].sort((a, b) => b.shipped_on.localeCompare(a.shipped_on) || b.created_at.localeCompare(a.created_at))[0];
  const portrait = format === "portrait";
  const requestedTheme = request.nextUrl.searchParams.get("theme");
  const theme = profile.is_pro && ["proof", "mono", "grid"].includes(requestedTheme ?? "") ? requestedTheme : "proof";
  const removeBranding = profile.is_pro && request.nextUrl.searchParams.get("branding") === "off";
  const cardBackground = theme === "mono"
    ? "radial-gradient(ellipse at 82% 10%, rgba(255,255,255,0.08), transparent 42%), linear-gradient(145deg, #0A0A0B, #111113)"
    : theme === "grid"
      ? "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(ellipse at 82% 10%, rgba(255,255,255,0.08), transparent 42%)"
      : "radial-gradient(ellipse at 82% 10%, rgba(255,255,255,0.08), transparent 42%), linear-gradient(145deg, #0A0A0B, #111113)";

  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: portrait ? "88px 76px" : "64px 72px",
        backgroundColor: "#0A0A0B",
        backgroundImage: cardBackground,
        color: "#EDEDEF",
        fontFamily: "Inter, Arial, sans-serif",
      }}>
        {!removeBranding && <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 700, letterSpacing: "-1px" }}>
          <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
            <defs><linearGradient id="proof-mark-gradient" x1="4" x2="36" y1="4" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#818CF8" /><stop offset="1" stopColor="#4F46E5" /></linearGradient></defs>
            <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#proof-mark-gradient)" />
            <path d="M13 28V12h8a5 5 0 0 1 0 10h-8m8 4 2.7 2.7L29 22" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
          </svg>
          proof
          <span style={{ marginLeft: "auto", color: "#8A8A93", fontSize: 16, fontWeight: 400 }}>BUILDING IN PUBLIC</span>
        </div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: portrait ? 820 : 980 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, color: "#8A8A93", fontSize: 21 }}>
            <span>@{profile.username}</span>
            {profile.is_verified && <span style={{ display: "flex", width: 20, height: 20, alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#F5C542", color: "#0A0A0B", fontSize: 14, fontWeight: 700 }}>✓</span>}
            <span>· {profile.full_name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={{ fontSize: portrait ? 106 : 88, fontWeight: 700, letterSpacing: "-8px" }}>{stats.current}</span>
            <span style={{ fontSize: 28, color: "#8A8A93" }}>day streak</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "25px 28px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, backgroundColor: "rgba(17,17,19,0.84)" }}>
            <div style={{ marginBottom: 12, color: "#8A8A93", fontSize: 16, letterSpacing: "2px" }}>LATEST SHIP</div>
            <div style={{ fontSize: portrait ? 32 : 29, lineHeight: 1.35 }}>{latestShip?.body ?? "Showing up, one small step at a time."}</div>
            {latestShip && <div style={{ display: "flex", gap: 7, marginTop: 14, color: "#8A8A93", fontSize: 17 }}>{latestShip.category} · {latestShip.shipped_on}</div>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 22, color: "#8A8A93", fontSize: 17 }}>
          <span>{stats.total} ships · {stats.longest} day best streak</span>
          <span>{removeBranding ? `@${profile.username}` : profileUrl}</span>
        </div>
      </div>
    ),
    {
      width: portrait ? 1080 : 1200,
      height: portrait ? 1350 : 630,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
    },
  );
}
