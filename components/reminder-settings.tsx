"use client";

import { useState } from "react";

async function savePreference(body: Record<string, unknown>) {
  const response = await fetch("/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "Your preferences could not be saved.");
}

function EmailToggle({ title, description, initialEnabled, field }: { title: string; description: string; initialEnabled: boolean; field: "enabled" | "recapEnabled" }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await savePreference({ [field]: !enabled });
      setEnabled(!enabled);
    } catch (preferenceError) {
      setError(preferenceError instanceof Error ? preferenceError.message : "Your preferences could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 max-w-lg text-xs leading-5 text-muted">{description}</p></div>
        <button aria-pressed={enabled} className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground disabled:opacity-50" disabled={busy} onClick={() => void toggle()} type="button">{busy ? "Saving…" : enabled ? "Turn off" : "Turn on"}</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}

function GoalField({ initialGoal }: { initialGoal: string }) {
  const [goal, setGoal] = useState(initialGoal);
  const [saved, setSaved] = useState(initialGoal);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await savePreference({ goal });
      setSaved(goal.trim());
      setGoal(goal.trim());
      setMessage(goal.trim() ? "Goal saved." : "Goal cleared.");
    } catch (goalError) {
      setError(goalError instanceof Error ? goalError.message : "Your goal could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium" htmlFor="goal">What are you working toward?</label>
      <p className="mt-1 max-w-lg text-xs leading-5 text-muted">Optional and private. It only appears in your own weekly recap, never on your public profile.</p>
      <div className="mt-3 flex gap-2">
        <input className="min-h-11 min-w-0 flex-1 rounded-control border border-white/[0.08] bg-background px-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="goal" maxLength={120} onChange={(event) => { setGoal(event.target.value); setMessage(""); }} placeholder="Launch my first app by December" value={goal} />
        <button className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground disabled:opacity-50" disabled={busy || goal.trim() === saved} onClick={() => void save()} type="button">{busy ? "Saving…" : "Save goal"}</button>
      </div>
      {message && <p className="mt-2 text-xs text-muted" role="status">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}

export function ReminderSettings({ initialEnabled, initialRecapEnabled = false, initialGoal = "" }: { initialEnabled: boolean; initialRecapEnabled?: boolean; initialGoal?: string }) {
  return (
    <section className="mt-5 space-y-6 border-t border-white/[0.08] pt-5">
      <GoalField initialGoal={initialGoal} />
      <EmailToggle description="Optional email around 9 a.m. in your timezone, only if you haven’t logged a ship or marked a rest day. Unsubscribe with one click." field="enabled" initialEnabled={initialEnabled} title="Daily reminder" />
      <EmailToggle description="Optional Sunday-or-Monday email summarising your last 7 days: ships by category, streaks, and your goal. Skipped on weeks with no ships. Unsubscribe with one click." field="recapEnabled" initialEnabled={initialRecapEnabled} title="Weekly recap" />
    </section>
  );
}
