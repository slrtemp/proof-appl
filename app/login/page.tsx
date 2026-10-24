import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { ProofMark } from "@/components/proof-mark";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-130px)] max-w-[1000px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_430px]">
        <div className="hidden lg:block">
          <ProofMark className="mb-6 size-12 shadow-lg shadow-indigo-950/40" />
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Build in the open</p>
          <h2 className="mt-3 max-w-md text-5xl font-semibold tracking-[-0.07em]">The work counts when you count it.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">Keep a simple daily record. Your progress deserves a place to live.</p>
          <Link className="mt-7 inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-foreground" href="/alex-morgan">See a public profile <span aria-hidden="true" className="ml-2">↗</span></Link>
        </div>
        <LoginForm errorCode={params.error} />
      </main>
    </AppShell>
  );
}
