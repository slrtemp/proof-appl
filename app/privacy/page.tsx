import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Proof handles account, profile, and shipping-log information.",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <header className="mb-7"><p className="text-xs text-muted">Proof / Privacy</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Privacy Policy</h1><p className="mt-2 text-xs text-muted">Effective October 25, 2026</p></header>
        <article className="space-y-5 rounded-card border border-white/[0.08] bg-surface p-5 text-sm leading-6 text-muted sm:p-7">
          <p>Proof stores account details, profile information, and work entries so the service can provide your shipping log, public profile, and requested account features. Public profiles and their ships are visible to people who visit the profile.</p>
          <section><h2 className="font-medium text-foreground">Information and providers</h2><p className="mt-2">Authentication and account data are handled through Supabase. If you subscribe to Pro, Stripe processes payment and subscription information. Proof does not store full payment-card numbers. The demo uses browser storage and does not send demo entries to the account database.</p></section>
          <section><h2 className="font-medium text-foreground">How information is used</h2><p className="mt-2">Information is used to operate and secure Proof, display public pages you choose to share, provide billing, send optional daily reminders if you opt in, and respond to support or safety reports. Analytics are computed from your logged ships; Proof does not currently track profile visitors.</p></section>
          <section><h2 className="font-medium text-foreground">Your choices</h2><p className="mt-2">You can edit profile information and choose whether your profile is public in Settings. You can also export your account data or request account deletion from your account settings.</p></section>
          <section><h2 className="font-medium text-foreground">Retention and contact</h2><p className="mt-2">Account information is retained while your account is active and removed when you delete the account, subject to records required by law and provider backups. For privacy questions, contact <a className="underline underline-offset-4 hover:text-foreground" href="mailto:support@tryproof.net">support@tryproof.net</a>.</p></section>
          <p className="border-t border-white/[0.07] pt-4 text-xs">This policy describes the current application behavior and is not legal advice. Review with counsel before production use.</p>
        </article>
      </main>
    </AppShell>
  );
}
