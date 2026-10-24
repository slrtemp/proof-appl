import { AppShell } from "@/components/app-shell";

export default function Loading() {
  return <AppShell><main className="mx-auto max-w-[900px] space-y-5 px-5 py-12 sm:px-8"><div className="skeleton h-8 w-72 rounded" /><div className="skeleton h-4 w-60 rounded" /><div className="skeleton h-72 rounded-card" /></main></AppShell>;
}
