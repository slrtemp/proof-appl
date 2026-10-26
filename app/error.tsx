"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-[720px] flex-col items-center justify-center px-5 text-center">
      <p className="text-xs font-medium text-muted">A small pause</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">That page didn’t load.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">Your work is safe. Try loading the page again, or return to Proof.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-[#7476ff]" onClick={reset} type="button">Try again</button>
        <Link className="inline-flex min-h-11 items-center rounded-control border border-white/[0.1] px-4 text-xs font-medium hover:bg-white/[0.04]" href="/">Back to Proof</Link>
      </div>
    </main>
  );
}
