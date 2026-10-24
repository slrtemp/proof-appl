import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="mx-auto flex min-h-[65vh] max-w-[720px] flex-col items-center justify-center px-5 text-center">
        <p className="text-xs font-medium text-muted">404 / NOT FOUND</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.07em]">This page hasn’t shipped.</h1>
        <p className="mt-3 text-sm text-muted">The link might be old, or the builder chose to keep this page private.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-medium text-white hover:bg-[#7476ff]" href="/"><ArrowLeft size={14} /> Back to Proof</Link>
      </main>
    </AppShell>
  );
}
