import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with your Proof account, shipping log, or subscription.",
};

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ reminder?: string }> }) {
  const { reminder } = await searchParams;
  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <header className="mb-7"><p className="text-xs text-muted">Proof / Support</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">How can we help?</h1><p className="mt-2 text-sm text-muted">For account, privacy, billing, or safety questions, reach out and we’ll help you find the next step.</p></header>
        <section className="rounded-card border border-white/[0.08] bg-surface p-5 sm:p-7">
          {reminder === "unsubscribed" && <p className="mb-4 rounded-control border border-emerald-200/10 bg-emerald-200/[0.04] p-3 text-xs text-emerald-100" role="status">You’re unsubscribed from Proof reminder emails.</p>}
          {reminder === "unsubscribe-error" && <p className="mb-4 rounded-control border border-red-200/10 bg-red-200/[0.04] p-3 text-xs text-red-100" role="alert">We couldn’t update that reminder preference. Please contact support.</p>}
          <h2 className="text-sm font-medium">Email Proof support</h2>
          <p className="mt-2 text-xs leading-5 text-muted">Include the page or account email you need help with. Please don’t send passwords or payment-card details.</p>
          <a className="mt-4 inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-[#7476ff]" href="mailto:support@tryproof.net">support@tryproof.net</a>
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs text-muted">See also <Link className="underline underline-offset-4 hover:text-foreground" href="/privacy">Privacy</Link> and <Link className="underline underline-offset-4 hover:text-foreground" href="/terms">Terms</Link>.</p>
        </section>
      </main>
    </AppShell>
  );
}
