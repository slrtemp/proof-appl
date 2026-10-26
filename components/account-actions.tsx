"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AccountActions() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    setError("");
    if (confirmation !== "DELETE") {
      setError('Type "DELETE" to confirm account deletion.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your account could not be deleted.");
      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Your account could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 border-t border-white/[0.08] pt-5">
      <p className="text-sm font-medium">Your data</p>
      <p className="mt-1 text-xs leading-5 text-muted">Download a copy of your profile and ships, or permanently delete your account.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground" onClick={() => window.location.assign("/api/account/export")} type="button">Export JSON</button>
        <button className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-3 text-xs font-medium text-muted hover:text-foreground" onClick={() => window.location.assign("/api/account/export?format=csv")} type="button">Export ships as CSV</button>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 text-xs text-muted" htmlFor="delete-account-confirmation">
          Type DELETE to confirm account deletion
          <input autoComplete="off" className="mt-1 min-h-11 w-full rounded-control border border-white/[0.08] bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="delete-account-confirmation" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} />
        </label>
        <Button disabled={busy || confirmation !== "DELETE"} onClick={() => void deleteAccount()} type="button" variant="secondary">{busy ? "Deleting…" : "Delete account"}</Button>
      </div>
      {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
    </section>
  );
}
