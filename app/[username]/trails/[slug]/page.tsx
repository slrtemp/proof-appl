import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { getPublicProfile } from "@/lib/profiles";
import { dateLabel } from "@/lib/streaks";
import { getTrailWithShips } from "@/lib/trails";
import { CATEGORY_COLORS } from "@/lib/types";

type TrailPageProps = { params: Promise<{ username: string; slug: string }> };

async function load({ params }: TrailPageProps) {
  const { username, slug } = await params;
  const data = await getPublicProfile(username);
  if (!data || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) return null;
  const trail = await getTrailWithShips(data.profile.id, slug);
  return trail ? { profile: data.profile, ...trail } : null;
}

export async function generateMetadata(props: TrailPageProps): Promise<Metadata> {
  const data = await load(props);
  if (!data) return { title: "Trail not found" };
  const title = `${data.trail.title} — ${data.profile.full_name}`;
  const description = data.trail.description || `${data.ships.length} ships on this trail by ${data.profile.full_name}.`;
  const image = `/api/cards/${encodeURIComponent(data.profile.username)}?format=landscape`;
  return {
    title,
    description,
    alternates: { canonical: `/${data.profile.username}/trails/${data.trail.slug}` },
    openGraph: { title, description, type: "article", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function TrailPage(props: TrailPageProps) {
  const data = await load(props);
  if (!data) notFound();
  const { profile, trail, ships } = data;
  const ordered = [...ships].sort((a, b) => a.shipped_on.localeCompare(b.shipped_on) || a.created_at.localeCompare(b.created_at));

  return (
    <AppShell>
      <main className="mx-auto max-w-[760px] px-5 py-8 sm:px-8 sm:py-12">
        <Link className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 text-xs text-muted transition-colors hover:border-white/[0.14] hover:text-foreground" href={`/${profile.username}`}>
          <ArrowLeft size={13} /> @{profile.username}
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">Project trail</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.06em] sm:text-[40px]">{trail.title}</h1>
        {trail.description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{trail.description}</p>}
        <p className="mt-3 text-xs text-muted">{ships.length} {ships.length === 1 ? "ship" : "ships"}{ordered.length > 0 && ` · ${dateLabel(ordered[0].shipped_on)} to ${dateLabel(ordered[ordered.length - 1].shipped_on)}`}</p>

        {ordered.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-white/[0.1] p-10 text-center text-sm text-muted">No ships on this trail yet.</div>
        ) : (
          <ol className="mt-8 space-y-0 border-l border-white/[0.1] pl-6">
            {ordered.map((ship) => (
              <li className="relative pb-6" key={ship.id}>
                <span aria-hidden="true" className="absolute -left-[31px] top-1.5 size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[ship.category] }} />
                <time className="text-[11px] text-muted" dateTime={ship.shipped_on}>{dateLabel(ship.shipped_on)}</time>
                <p className="mt-1 text-sm leading-6 sm:text-[15px]">{ship.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium" style={{ color: CATEGORY_COLORS[ship.category], borderColor: `${CATEGORY_COLORS[ship.category]}40`, backgroundColor: `${CATEGORY_COLORS[ship.category]}12` }}>{ship.category}</span>
                  {ship.link && <a className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 text-[10px] text-muted hover:text-foreground" href={ship.link} rel="noopener noreferrer ugc" target="_blank">View work <ArrowUpRight size={11} /></a>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </AppShell>
  );
}
