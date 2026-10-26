"use client";

import { useState } from "react";

export function ReminderSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    const next = !enabled;
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Reminder preferences could not be saved.");
      setEnabled(next);
    } catch (preferenceError) {
      setError(preferenceError instanceof Error ? preferenceError.message : "Reminder preferences could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 border-t border-white/[0.08] pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-sm font-medium">Daily reminder</h3><p className="mt-1 max-w-lg text-xs leading-5 text-muted">Optional email around 9 a.m. in your timezone, only if you haven’t logged a ship or marked a rest day. Unsubscribe with one click.</p></div>
        <button aria-pressed={enabled} className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground disabled:opacity-50" disabled={busy} onClick={() => void toggle()} type="button">{busy ? "Saving…" : enabled ? "Turn off" : "Turn on"}</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
    </section>
  );
}
