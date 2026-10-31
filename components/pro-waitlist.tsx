"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

export function ProWaitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("busy");
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We couldn’t save that. Please try again.");
      setStatus("done");
    } catch (waitlistError) {
      setError(waitlistError instanceof Error ? waitlistError.message : "We couldn’t save that. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return <p className="rounded-control border border-white/[0.08] bg-background p-3 text-center text-xs text-muted" role="status">You’re on the list. We’ll email you when Pro opens.</p>;
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <Button className="w-full" disabled type="button" variant="secondary">Pro coming soon</Button>
      <label className="sr-only" htmlFor="waitlist-email">Email address</label>
      <div className="flex gap-2">
        <input
          autoComplete="email"
          className="min-h-11 min-w-0 flex-1 rounded-control border border-white/[0.1] bg-background px-3 text-sm outline-none focus:border-white/30"
          id="waitlist-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <Button disabled={status === "busy"} type="submit">{status === "busy" ? "Joining…" : "Join waitlist"}</Button>
      </div>
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
    </form>
  );
}
