import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1080px] space-y-14 px-5 py-14 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_430px]">
          <div className="space-y-4"><div className="skeleton h-8 w-60 rounded-full" /><div className="skeleton h-28 w-full max-w-xl rounded" /><div className="skeleton h-14 w-full max-w-lg rounded" /><div className="skeleton h-12 w-52 rounded-control" /></div>
          <div className="space-y-4 rounded-card border border-white/[0.08] bg-surface p-6"><div className="skeleton h-10 w-40 rounded-full" /><div className="skeleton h-3 w-24 rounded" />{[0, 1, 2].map((item) => <div className="space-y-2 border-t border-white/[0.08] py-3" key={item}><div className="skeleton h-4 w-full rounded" /><div className="skeleton h-3 w-32 rounded" /></div>)}</div>
        </div>
        <div className="grid gap-5 border-t border-white/[0.08] pt-8 sm:grid-cols-3">{[0, 1, 2].map((item) => <div className="space-y-3" key={item}><div className="skeleton h-3 w-8 rounded" /><div className="skeleton h-5 w-36 rounded" /><div className="skeleton h-12 w-full rounded" /></div>)}</div>
      </main>
    </AppShell>
  );
}
