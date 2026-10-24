"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Github, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function getAuthRedirectUrl() {
  const redirectUrl = new URL(
    "/auth/callback",
    process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
  );
  redirectUrl.searchParams.set("next", "/");
  return redirectUrl.toString();
}

export function LoginForm({ errorCode }: { errorCode?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<"github" | "google" | null>(null);
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!configured) {
      setError("Add your Supabase URL and anon key to .env.local to enable sign-in.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          shouldCreateUser: true,
        },
      });
      if (authError) throw authError;
      setMessage("Magic link sent. Check your inbox to continue.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "The sign-in link could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "github" | "google") {
    setError("");
    setMessage("");
    if (!configured) {
      setError("Add your Supabase URL and anon key to .env.local to enable sign-in.");
      return;
    }
    setBusyProvider(provider);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "That sign-in option could not be started.");
      setBusyProvider(null);
    }
  }

  return (
    <div className="rounded-card border border-white/[0.08] bg-surface p-6 sm:p-8">
      <p className="text-xs font-medium text-muted">YOUR WORK, REMEMBERED</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Sign in or create your account.</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Choose Google, GitHub, or a private email link. New here? We’ll create your account as you continue.</p>
      {errorCode && <p className="mt-4 rounded-control border border-red-300/20 bg-red-300/5 p-3 text-xs text-red-200" role="alert">{errorCode === "auth-not-configured" ? "Sign-in is not configured yet." : "That sign-in link could not be completed. Try again."}</p>}
      <div className="mt-6 grid gap-2">
        <Button disabled={busy || busyProvider !== null} onClick={() => oauth("github")} type="button" variant="secondary"><Github size={16} />{busyProvider === "github" ? "Opening GitHub…" : "Continue with GitHub"}</Button>
        <Button disabled={busy || busyProvider !== null} onClick={() => oauth("google")} type="button" variant="secondary"><span aria-hidden="true" className="text-base font-semibold">G</span>{busyProvider === "google" ? "Opening Google…" : "Continue with Google"}</Button>
      </div>
      <div className="my-5 flex items-center gap-3 text-[11px] text-muted"><span className="h-px flex-1 bg-white/[0.08]" />or with email<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <form className="space-y-3" onSubmit={sendLink}>
        <label className="sr-only" htmlFor="email">Email address</label>
        <input autoComplete="email" className="min-h-11 w-full rounded-control border border-white/[0.08] bg-background px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
        <Button className="w-full" disabled={busy || busyProvider !== null} type="submit"><Mail size={15} />{busy ? "Sending link…" : "Email me a sign-in link"}</Button>
      </form>
      {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
      {message && <p className="mt-3 text-xs text-emerald-200" role="status">{message}</p>}
      <p className="mt-5 text-center text-[11px] leading-5 text-muted">Demo first? <Link className="text-foreground underline decoration-white/20 underline-offset-4 hover:decoration-white/60" href="/">Explore the live preview</Link></p>
    </div>
  );
}
