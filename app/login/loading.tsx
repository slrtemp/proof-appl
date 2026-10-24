import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-130px)] max-w-[1000px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_430px]">
        <div className="hidden space-y-4 lg:block"><div className="skeleton size-11 rounded-[12px]" /><div className="skeleton h-3 w-32 rounded" /><div className="skeleton h-24 w-full max-w-md rounded" /><div className="skeleton h-4 w-72 rounded" /></div>
        <div className="space-y-4 rounded-card border border-white/[0.08] bg-surface p-7"><div className="skeleton h-3 w-32 rounded" /><div className="skeleton h-9 w-64 rounded" /><div className="skeleton h-4 w-56 rounded" /><div className="skeleton mt-7 h-11 rounded-control" /><div className="skeleton h-11 rounded-control" /><div className="skeleton h-11 rounded-control" /><div className="skeleton h-10 rounded-control" /></div>
      </main>
    </AppShell>
  );
}
