import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] space-y-5 px-5 py-10 sm:px-8">
        <div className="space-y-3"><div className="skeleton h-3 w-24 rounded" /><div className="skeleton h-8 w-72 max-w-full rounded" /><div className="skeleton h-4 w-56 rounded" /></div>
        <div className="space-y-5 rounded-card border border-white/[0.08] bg-surface p-6">{[0, 1, 2].map((item) => <div className="space-y-2" key={item}><div className="skeleton h-3 w-24 rounded" /><div className="skeleton h-11 rounded-control" /></div>)}</div>
        <div className="skeleton h-44 rounded-card" />
      </main>
    </AppShell>
  );
}
