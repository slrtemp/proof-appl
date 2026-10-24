import { ImageResponse } from "next/og";

export const alt = "Proof — Make your work visible";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "68px 76px", backgroundColor: "#0A0A0B", backgroundImage: "radial-gradient(ellipse at 82% 8%, rgba(99,102,241,0.25), transparent 46%), radial-gradient(ellipse at 5% 95%, rgba(56,189,248,0.08), transparent 42%)", color: "#EDEDEF", fontFamily: "Inter, Arial, sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}>
          <svg width="46" height="46" viewBox="0 0 40 40" fill="none">
            <defs><linearGradient id="brand" x1="4" x2="36" y1="4" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#818CF8" /><stop offset="1" stopColor="#4F46E5" /></linearGradient></defs>
            <rect x="1" y="1" width="38" height="38" rx="12" fill="url(#brand)" />
            <path d="M13 28V12h8a5 5 0 0 1 0 10h-8m8 4 2.7 2.7L29 22" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
          </svg>
          proof
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ color: "#A5B4FC", fontSize: 20, letterSpacing: "2px" }}>THE WORK BEHIND THE WIN</div>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-5px" }}>Make progress visible.</div>
          <div style={{ color: "#A1A1AA", fontSize: 22 }}>One small ship at a time.</div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 22, color: "#8A8A93", fontSize: 17 }}>Small ships add up.</div>
      </div>
    ),
    size,
  );
}
