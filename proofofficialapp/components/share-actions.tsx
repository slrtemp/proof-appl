"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Image as ImageIcon, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareActions({ username, compact = false, isPro = false }: { username: string; compact?: boolean; isPro?: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState("proof");
  const [removeBranding, setRemoveBranding] = useState(false);

  function cardPath(format: "landscape" | "portrait") {
    const params = new URLSearchParams({ format });
    if (isPro) {
      params.set("theme", theme);
      if (removeBranding) params.set("branding", "off");
    }
    return `/api/cards/${encodeURIComponent(username)}?${params.toString()}`;
  }

  async function getCardUrl(format: "landscape" | "portrait") {
    const response = await fetch(cardPath(format));
    if (!response.ok) throw new Error("Could not create this share card. Try again.");
    return response.blob();
  }

  async function download(format: "landscape" | "portrait") {
    setBusy(true);
    setMessage("");
    try {
      const blob = await getCardUrl(format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `proof-${username}-${format}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`${format === "landscape" ? "Wide" : "Story"} card downloaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create this card.");
    } finally {
      setBusy(false);
    }
  }

  async function copyImage(format: "landscape" | "portrait") {
    try {
      const blob = await getCardUrl(format);
      if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setMessage("Image copied to clipboard.");
      } else {
        await navigator.clipboard.writeText(new URL(cardPath(format), window.location.href).toString());
        setMessage("Card link copied.");
      }
    } catch (copyError) {
      setMessage(copyError instanceof Error ? copyError.message : "Could not copy the card.");
    }
  }

  return (
    <div className="space-y-3">
      {isPro ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="sr-only" htmlFor="share-theme">Share card theme</label>
          <select className="min-h-9 rounded-control border border-white/[0.08] bg-background px-2.5 text-xs text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="share-theme" onChange={(event) => setTheme(event.target.value)} value={theme}>
            <option value="proof">Proof</option>
            <option value="mono">Monochrome</option>
            <option value="grid">Grid</option>
          </select>
          <label className="inline-flex min-h-9 items-center gap-2 text-xs text-muted">
            <input checked={removeBranding} className="size-4 rounded border-white/20 bg-background accent-white focus:ring-accent" onChange={(event) => setRemoveBranding(event.target.checked)} type="checkbox" />
            Remove branding
          </label>
        </div>
      ) : (
        <Link className="inline-flex min-h-9 items-center gap-1.5 text-[11px] text-muted hover:text-foreground" href="/settings#plan"><LockKeyhole size={12} /> More themes &amp; no branding with Pro <span>↗</span></Link>
      )}
      <div className={compact ? "grid grid-cols-1 gap-2" : "flex flex-wrap gap-2"}>
        <Button disabled={busy} onClick={() => download("landscape")} size="sm" variant="secondary"><Download size={13} /> Wide card</Button>
        <Button disabled={busy} onClick={() => download("portrait")} size="sm" variant="secondary"><ImageIcon size={13} /> Story card</Button>
        <Button disabled={busy} onClick={() => copyImage("landscape")} size="sm" variant="ghost"><Copy size={13} /> Copy image</Button>
      </div>
      {message && <p className="flex items-center gap-1.5 text-xs text-muted" role="status"><Check className="text-foreground" size={13} />{message}</p>}
    </div>
  );
}
