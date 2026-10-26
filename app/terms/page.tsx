import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Proof.",
};

export default function TermsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">
        <header className="mb-7"><p className="text-xs text-muted">Proof / Terms</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Terms of Service</h1><p className="mt-2 text-xs text-muted">Effective October 25, 2026</p></header>
        <article className="space-y-5 rounded-card border border-white/[0.08] bg-surface p-5 text-sm leading-6 text-muted sm:p-7">
          <p>By using Proof, you agree to use the service lawfully and to keep your account credentials secure. You are responsible for the content you submit and for deciding what to publish on your public profile.</p>
          <section><h2 className="font-medium text-foreground">Your content and public profiles</h2><p className="mt-2">You retain ownership of your work entries and profile content. You give Proof permission to store and display content as needed to operate the service, including publicly displaying content on a profile you make public. Do not submit content that violates another person’s rights or applicable law.</p></section>
          <section><h2 className="font-medium text-foreground">Plans and billing</h2><p className="mt-2">Free and Pro features are described on the pricing page. Pro subscriptions are billed by Stripe at the selected interval. You can manage or cancel through the billing portal; access may continue until the paid period ends.</p></section>
          <section><h2 className="font-medium text-foreground">Availability and account closure</h2><p className="mt-2">Proof is provided as available and may change as the product develops. You may export or delete your account through Settings. We may restrict accounts that abuse the service, threaten safety, or violate these terms.</p></section>
          <section><h2 className="font-medium text-foreground">Contact</h2><p className="mt-2">Questions about these terms can be sent to <a className="underline underline-offset-4 hover:text-foreground" href="mailto:support@tryproof.net">support@tryproof.net</a>.</p></section>
          <p className="border-t border-white/[0.07] pt-4 text-xs">These terms are a product draft, not legal advice. They should be reviewed by counsel before production use.</p>
        </article>
      </main>
    </AppShell>
  );
}
