import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[820px] space-y-8 px-5 py-14 sm:px-8">
        <div className="mx-auto space-y-3 text-center"><div className="skeleton mx-auto h-3 w-28 rounded" /><div className="skeleton mx-auto h-10 w-96 max-w-full rounded" /><div className="skeleton mx-auto h-4 w-64 max-w-full rounded" /></div>
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((item) => <div className="skeleton h-[430px] rounded-card" key={item} />)}</div>
      </main>
    </AppShell>
  );
}
