"use client";

import { useEffect, useState, type ReactNode } from "react";

const HIDDEN_PROFILES_KEY = "proof-hidden-profiles-v1";

export function ProfileSafetyActions({ username, children }: { username: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hiddenProfiles = readHiddenProfiles();
    setHidden(hiddenProfiles.includes(username.toLowerCase()));
  }, [username]);

  function toggleHidden() {
    const hiddenProfiles = readHiddenProfiles();
    const next = hidden
      ? hiddenProfiles.filter((profile) => profile !== username.toLowerCase())
      : [...new Set([...hiddenProfiles, username.toLowerCase()])];
    window.localStorage.setItem(HIDDEN_PROFILES_KEY, JSON.stringify(next));
    setHidden(!hidden);
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setError("");
    const cleanReason = reason.trim();
    if (cleanReason.length < 10) {
      setError("Please add at least 10 characters so we understand the concern.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/profile/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, reason: cleanReason }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The report could not be submitted.");
      setReason("");
      setStatus("Thanks. Your report has been sent for review.");
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "The report could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  if (hidden) {
    return (
      <section className="mt-8 rounded-card border border-white/[0.08] bg-surface p-5 text-center" role="status">
        <p className="text-sm font-medium">You’ve hidden this profile on this device.</p>
        <button className="mt-2 inline-flex min-h-11 items-center text-xs text-muted underline underline-offset-4 hover:text-foreground" onClick={toggleHidden} type="button">Show this profile again</button>
      </section>
    );
  }

  return (
    <>
      {children}
      <section className="mt-8 rounded-card border border-white/[0.08] bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">Something feel wrong with this profile?</p>
          <button className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs text-muted hover:text-foreground" onClick={toggleHidden} type="button">Hide on this device</button>
        </div>
        <form className="mt-3" onSubmit={submitReport}>
          <label className="mb-2 block text-xs text-muted" htmlFor="profile-report-reason">Report this profile</label>
          <textarea className="min-h-20 w-full resize-y rounded-control border border-white/[0.08] bg-background px-3 py-2 text-xs leading-5 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="profile-report-reason" maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="Tell us what concerns you (10–1000 characters)." value={reason} />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted">{reason.length}/1000</span>
            <button className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium hover:bg-white/[0.04] disabled:opacity-50" disabled={busy} type="submit">{busy ? "Sending…" : "Send report"}</button>
          </div>
          {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
          {status && <p className="mt-2 text-xs text-emerald-200" role="status">{status}</p>}
        </form>
      </section>
    </>
  );
}

function readHiddenProfiles(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(HIDDEN_PROFILES_KEY) || "[]");
    return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
  } catch {
    return [];
  }
}
