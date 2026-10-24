import { AppShell } from "@/components/app-shell";
import { ProofTreeSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] space-y-8 px-5 py-12 sm:px-8">
        <div className="flex gap-4 border-b border-white/[0.08] pb-8">
          <div className="skeleton size-16 rounded-full" />
          <div className="flex-1 space-y-3"><div className="skeleton h-8 w-56 rounded" /><div className="skeleton h-4 w-32 rounded" /><div className="skeleton h-4 w-full max-w-md rounded" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((item) => <div className="skeleton h-24 rounded-card" key={item} />)}</div>
        <div className="space-y-5 rounded-card border border-white/[0.08] bg-surface p-5"><div className="skeleton h-4 w-48 rounded" /><ProofTreeSkeleton /></div>
        {[0, 1, 2].map((item) => <div className="skeleton h-16 rounded-card" key={item} />)}
      </main>
    </AppShell>
  );
}
