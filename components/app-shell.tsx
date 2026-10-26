import Link from "next/link";
import type { ReactNode } from "react";
import { Command } from "lucide-react";

import { CommandMenu } from "@/components/command-menu";
import { HeaderAction, MainNavigation } from "@/components/main-navigation";
import { ProofMark } from "@/components/proof-mark";
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, hasProAccess, needsBillingPortal } from "@/lib/billing";

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  let signedIn = false;
  let hasBilling = false;
  let isPro = false;
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") {
      console.error("Could not determine the signed-in Proof user.", error);
    }
    signedIn = Boolean(user);
    if (user) {
      const subscription = await getUserSubscription(user.id);
      isPro = hasProAccess(subscription);
      hasBilling = needsBillingPortal(subscription);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/85 backdrop-blur-2xl">
        <div className="relative mx-auto flex min-h-[68px] max-w-[1180px] flex-wrap items-center justify-between gap-x-5 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-[-0.045em]" aria-label="Proof home">
            <ProofMark className="size-8 shadow-lg shadow-indigo-950/40" />
            <span className="text-base">proof</span>
          </Link>
          <MainNavigation hasBilling={hasBilling} isPro={isPro} />
          <HeaderAction signedIn={signedIn} />
        </div>
      </header>
      {children}
      <div className="fixed bottom-4 right-4 z-30 hidden sm:block">
        <button
          type="button"
          data-command-trigger
          className="inline-flex min-h-10 items-center gap-2 rounded-control border border-white/[0.1] bg-elevated/90 px-3 text-xs text-muted shadow-lg shadow-black/20 backdrop-blur transition-colors hover:text-foreground"
          aria-label="Open command menu"
        >
          <Command size={13} />
          <span>Quick actions</span>
          <kbd className="ml-2 rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
      </div>
      <CommandMenu />
      <footer className="border-t border-white/[0.06] bg-black/10">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link className="inline-flex items-center gap-2.5 transition-colors hover:text-foreground" href="/" aria-label="Proof home">
            <ProofMark className="size-6" />
            <span>Proof <span className="px-1 text-white/20">·</span> Small ships add up.</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/welcome" className="transition-colors hover:text-foreground">About Proof</Link>
            <Link href="/profile" className="transition-colors hover:text-foreground">Profile</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
