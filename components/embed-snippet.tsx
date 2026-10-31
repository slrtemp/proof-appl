"use client";

import { useState } from "react";

function CopyBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">{label}</p>
        <button className="min-h-11 px-2 text-xs text-muted hover:text-foreground" onClick={() => { void navigator.clipboard.writeText(code).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); }} type="button">{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className="overflow-x-auto rounded-control border border-white/[0.08] bg-background p-3 text-[11px] leading-5 text-muted"><code>{code}</code></pre>
    </div>
  );
}

export function EmbedSnippet({ origin, username }: { origin: string; username: string }) {
  const profile = `${origin}/${username}`;
  const dark = `${origin}/api/embed/${username}`;
  const light = `${origin}/api/embed/${username}?theme=light`;
  return (
    <section aria-labelledby="embed-title">
      <h2 className="text-sm font-medium" id="embed-title">Embed your activity map</h2>
      <p className="mt-1 text-xs leading-5 text-muted">Shows your last 26 weeks of ships and links to your profile. It updates about once an hour. Only works while your profile is public.</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG served by our own endpoint */}
      <img alt="Your Proof activity map (dark)" className="mt-3 max-w-full rounded-control" src={dark} />
      <CopyBlock code={`[![Proof activity](${dark})](${profile})`} label="Markdown for a README (dark)" />
      <CopyBlock code={`[![Proof activity](${light})](${profile})`} label="Markdown for light backgrounds" />
      <CopyBlock code={`<a href="${profile}"><img src="${dark}" alt="Proof activity" /></a>`} label="HTML for a website" />
    </section>
  );
}
