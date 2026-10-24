import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Check, Flame, Globe2, Layers3, MapPin, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { ProofTree } from "@/components/proof-tree";
import { ShareActions } from "@/components/share-actions";
import { getPublicProfile } from "@/lib/profiles";
import { dateLabel, getStreakStats } from "@/lib/streaks";
import { CATEGORY_COLORS } from "@/lib/types";

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data) return { title: "Builder not found" };

  const { profile, ships } = data;
  const stats = getStreakStats(ships);
  const title = `${profile.full_name} — ships in public`;
  const description = profile.bio || `${profile.tagline || "Building in public"}, with ${stats.total} ships and a ${stats.current}-day current streak. Follow ${profile.full_name}'s builder log on Proof.`;
  const image = `/api/cards/${encodeURIComponent(profile.username)}?format=landscape`;
  return {
    title,
    description,
    alternates: { canonical: `/${profile.username}` },
    openGraph: { title, description, type: "profile", images: [{ url: image, width: 1200, height: 630, alt: `${profile.full_name}'s Proof shipping streak` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const data = await getPublicProfile(username);
  if (!data) notFound();

  const { profile, ships } = data;
  const stats = getStreakStats(ships);
  const categoryCount = new Set(ships.map((ship) => ship.category)).size;
  const sortedShips = [...ships].sort((a, b) => b.shipped_on.localeCompare(a.shipped_on) || b.created_at.localeCompare(a.created_at));

  return (
    <AppShell>
      <main className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 sm:py-12">
        <Link className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 text-xs text-muted transition-colors hover:border-white/[0.14] hover:text-foreground" href="/">
          <ArrowLeft size={13} /> Back to Proof
        </Link>

        <section className="relative overflow-hidden rounded-card border border-white/[0.09] bg-gradient-to-br from-[#17171d] via-[#111113] to-[#101014] p-5 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-32 size-96 rounded-full bg-indigo-500/[0.12] blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 size-72 rounded-full bg-sky-400/[0.055] blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="grid size-[84px] shrink-0 place-items-center overflow-hidden rounded-[26px] border border-white/[0.12] bg-gradient-to-br from-indigo-300/20 via-[#242431] to-elevated text-xl font-semibold text-indigo-100 shadow-xl shadow-black/25 sm:size-24 sm:rounded-[30px]">
              {profile.avatar_url
                ? <Image alt={`${profile.full_name}'s profile photo`} className="size-full object-cover" height={96} src={profile.avatar_url} unoptimized width={96} />
                : profile.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-200/15 bg-indigo-300/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-indigo-100/75">Builder in public</span>
                {profile.is_verified && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/15 bg-emerald-200/[0.05] px-2.5 py-1 text-[9px] font-medium text-emerald-100/80"><BadgeCheck size={11} /> Verified</span>}
              </div>
              <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[34px] font-semibold leading-tight tracking-[-0.065em] sm:text-[44px]">
                <span>{profile.full_name}</span>
                {profile.is_pro && <span aria-label="Proof Pro" className="rounded-full border border-indigo-200/20 bg-indigo-300/[0.08] px-2.5 py-1 align-middle font-sans text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-indigo-100/80">Pro</span>}
              </h1>
              <p className="mt-1.5 text-sm text-muted">@{profile.username}</p>
              {profile.tagline && <p className="mt-4 text-base font-medium leading-6 tracking-[-0.02em] text-[#e0e0e5]">{profile.tagline}</p>}
              <p className={`${profile.tagline ? "mt-2" : "mt-4"} max-w-xl text-sm leading-6 text-muted`}>{profile.bio || "Showing up, one small ship at a time."}</p>
              {(profile.location || profile.website) && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
                  {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin size={12} />{profile.location}</span>}
                  {profile.website && <a className="inline-flex min-h-8 items-center gap-1.5 transition-colors hover:text-foreground" href={profile.website} rel="noreferrer" target="_blank"><Globe2 size={12} />{profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}<ArrowUpRight size={11} /></a>}
                </div>
              )}
              <div className="mt-5"><ShareActions isPro={profile.is_pro} username={profile.username} /></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4 sm:gap-3" aria-label="Shipping statistics">
          <ProfileStat value={`${stats.total}`} label="Ships logged" icon={<Check className="text-indigo-200/80" size={14} />} />
          <ProfileStat value={`${stats.current}`} label="Current streak" icon={<Flame className="text-orange-200/80" size={14} />} />
          <ProfileStat value={`${stats.longest}`} label="Best streak" icon={<Sparkles className="text-amber-200/80" size={14} />} />
          <ProfileStat value={`${categoryCount}`} label="Work lanes" icon={<Layers3 className="text-sky-200/80" size={14} />} />
        </section>

        <div className="mt-2">
          <ProofTree ships={sortedShips} />
        </div>

        <section className="mt-10" aria-labelledby="timeline-heading">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">The archive</p>
              <h2 className="mt-1.5 text-xl font-medium tracking-[-0.04em]" id="timeline-heading">A record of the work.</h2>
              <p className="mt-1 text-xs text-muted">A growing collection of small wins.</p>
            </div>
            <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] tabular-nums text-muted">{ships.length} ships</span>
          </div>
          {sortedShips.length ? (
            <div className="space-y-2.5">
              {sortedShips.map((ship) => (
                <article className="relative flex gap-4 overflow-hidden rounded-card border border-white/[0.07] bg-gradient-to-r from-[#141418] to-[#111113] p-4 transition-colors hover:border-white/[0.13] sm:gap-5 sm:p-5" key={ship.id}>
                  <span aria-hidden="true" className="absolute bottom-4 left-0 top-4 w-[2px] rounded-r-full opacity-80" style={{ backgroundColor: CATEGORY_COLORS[ship.category] }} />
                  <time className="w-[62px] shrink-0 pt-1 text-[11px] text-muted" dateTime={ship.shipped_on}>{dateLabel(ship.shipped_on)}</time>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-foreground sm:text-[15px]">{ship.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium" style={{ color: CATEGORY_COLORS[ship.category], borderColor: `${CATEGORY_COLORS[ship.category]}40`, backgroundColor: `${CATEGORY_COLORS[ship.category]}12` }}>{ship.category}</span>
                      {ship.link && <a className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 text-[10px] text-muted transition-colors hover:border-white/[0.16] hover:text-foreground" href={ship.link} rel="noreferrer" target="_blank">View work <ArrowUpRight size={11} /></a>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-white/[0.1] bg-white/[0.015] p-10 text-center">
              <p className="text-sm font-medium">No ships shared yet.</p>
              <p className="mt-1 text-xs text-muted">The next small step starts the story.</p>
            </div>
          )}
        </section>
        <p className="mt-10 text-center text-[10px] text-muted">This profile and its ships are visible to anyone with the link.</p>
      </main>
    </AppShell>
  );
}

function ProfileStat({ value, label, icon }: { value: string; label: string; icon: ReactNode }) {
  return (
    <div className="rounded-card border border-white/[0.08] bg-gradient-to-br from-surface to-[#101012] p-4 sm:p-5">
      <div className="flex items-center justify-between">{icon}<span className="text-[10px] text-muted">{label}</span></div>
      <p className="mt-4 text-[27px] font-semibold leading-none tracking-[-0.06em]">{value}</p>
    </div>
  );
}
