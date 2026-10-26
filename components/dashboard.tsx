"use client";

import Link from "next/link";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Award, BookOpen, CalendarDays, Check, Code2, Flame, Link2, LockKeyhole, Megaphone, Palette, Plus, Rocket, Sparkles, X, Zap, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProofTree } from "@/components/proof-tree";
import { getBuilderProgress } from "@/lib/gamification";
import { dateLabel, getStreakStats } from "@/lib/streaks";
import type { Profile, Ship, ShipCategory } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEMO_STORAGE_KEY = "proof-demo-ships-v1";
const MAX_SHIP_LENGTH = 280;
const CATEGORY_ICONS: Record<ShipCategory, LucideIcon> = {
  Code: Code2,
  Design: Palette,
  Marketing: Megaphone,
  Launch: Rocket,
  Learning: BookOpen,
};

export function Dashboard({ demoProfile, initialShips, isPro, hasBilling = false, billingNotice, demoMode }: { demoProfile: Profile; initialShips: Ship[]; isPro: boolean; hasBilling?: boolean; billingNotice?: string | null; demoMode: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const initialTodayShip = initialShips.find((ship) => ship.shipped_on === today);
  const [ships, setShips] = useState(initialShips);
  const [body, setBody] = useState(initialTodayShip?.body ?? "");
  const [category, setCategory] = useState<ShipCategory | "">(initialTodayShip?.category ?? "");
  const [link, setLink] = useState(initialTodayShip?.link ?? "");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLink, setShowLink] = useState(Boolean(initialTodayShip?.link));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!demoMode) return;
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(isShip)) {
          setShips(parsed);
          const savedTodayShip = parsed.find((ship) => ship.shipped_on === today);
          if (savedTodayShip) {
            setBody(savedTodayShip.body);
            setCategory(savedTodayShip.category);
            setLink(savedTodayShip.link ?? "");
            setShowLink(Boolean(savedTodayShip.link));
          }
        }
      }
    } catch (loadError) {
      console.error("Could not load Proof demo ships.", loadError);
      setError("Your local demo log could not be loaded.");
    }
  }, [demoMode, today]);

  useEffect(() => {
    const quickLog = () => {
      document.querySelector("#daily-log")?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("proof:quick-log", quickLog);
    return () => window.removeEventListener("proof:quick-log", quickLog);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const sortedShips = useMemo(
    () => [...ships].sort((a, b) => b.shipped_on.localeCompare(a.shipped_on) || b.created_at.localeCompare(a.created_at)),
    [ships],
  );
  const stats = useMemo(() => getStreakStats(ships), [ships]);
  const builderProgress = useMemo(() => getBuilderProgress(ships, stats), [ships, stats]);
  const existingTodayShip = ships.find((ship) => ship.shipped_on === today);

  async function submitShip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const cleanBody = body.trim();
    if (!cleanBody) {
      setError("Add one sentence about what you shipped.");
      inputRef.current?.focus();
      return;
    }
    if (cleanBody.length > MAX_SHIP_LENGTH) {
      setError(`Keep your ship under ${MAX_SHIP_LENGTH} characters.`);
      return;
    }

    let normalizedLink: string | null = null;
    if (link.trim()) {
      try {
        const parsedLink = new URL(link.startsWith("http") ? link : `https://${link}`);
        if (!["http:", "https:"].includes(parsedLink.protocol)) throw new Error("Unsupported link protocol.");
        normalizedLink = parsedLink.toString();
      } catch {
        setError("Enter a valid web link, like example.com/project.");
        return;
      }
    }

    setError("");
    setSubmitting(true);
    const now = new Date();
    const optimistic: Ship = {
      id: existingTodayShip?.id ?? `local-${crypto.randomUUID()}`,
      user_id: demoProfile.id,
      body: cleanBody,
      category: category || "Code",
      link: normalizedLink,
      shipped_on: today,
      created_at: now.toISOString(),
    };
    const before = ships;
    const previousForm = { body, category, link, showLink };
    const next = [optimistic, ...ships.filter((ship) => ship.shipped_on !== today)];
    setShips(next);
    setBody(existingTodayShip ? cleanBody : "");
    setLink(existingTodayShip ? normalizedLink ?? "" : "");
    setCategory(existingTodayShip ? optimistic.category : "");
    setShowLink(existingTodayShip ? Boolean(normalizedLink) : false);
    setToast(existingTodayShip ? "Today’s ship updated." : "Ship logged. Keep showing up.");

    try {
      if (demoMode) {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
        return;
      }

      const response = await fetch("/api/ships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: cleanBody, category: category || null, link: normalizedLink }),
      });
      if (response.status !== 401 && response.status !== 503) {
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error || "Your ship could not be saved.");
        }
        const result = await response.json() as { ship: Ship };
        setShips((current) => [result.ship, ...current.filter((ship) => ship.shipped_on !== today)]);
      } else {
        throw new Error("Sign in to save ships to your account.");
      }
    } catch (submitError) {
      setShips(before);
      setBody(previousForm.body);
      setCategory(previousForm.category);
      setLink(previousForm.link);
      setShowLink(previousForm.showLink);
      setError(submitError instanceof Error ? submitError.message : "Your ship could not be saved.");
      setToast("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0 space-y-9">
          <section className="relative overflow-hidden rounded-card border border-white/[0.08] bg-gradient-to-br from-[#15151b] via-[#101012] to-[#101014] px-6 py-7 sm:px-8 sm:py-9">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-indigo-500/[0.12] blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 size-56 rounded-full bg-sky-400/[0.05] blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-indigo-200/75">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p>
                <h1 className="max-w-xl text-[34px] font-semibold leading-[1.04] tracking-[-0.065em] sm:text-[44px]">Your progress,<br className="hidden sm:block" /> made visible.</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted">One small ship at a time. Keep a record of the work that moves you forward.</p>
            </div>
              <Link className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-control border border-white/[0.1] bg-white/[0.035] px-4 text-xs font-medium text-foreground transition-colors hover:border-indigo-200/25 hover:bg-white/[0.06]" href={`/${demoProfile.username}`}>
                Your public page <ArrowUpRight size={14} />
            </Link>
            </div>
            <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.07] pt-4 text-[11px] text-muted">
              <span className="inline-flex items-center gap-2"><Flame className="text-orange-200/80" size={13} /> {stats.current} day streak</span>
              <span className="inline-flex items-center gap-2"><Check className="text-emerald-200/80" size={13} /> {stats.total} ships logged</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="text-indigo-200/80" size={13} /> Best: {stats.longest} days</span>
            </div>
          </section>

          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-card border border-indigo-200/[0.13] bg-gradient-to-br from-[#17171d] via-surface to-[#111116] p-5 shadow-xl shadow-black/10 sm:p-6"
            initial={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            aria-labelledby="log-title"
            id="daily-log"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-56 rounded-full bg-indigo-400/[0.06] blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-indigo-200/75">{existingTodayShip ? "Today’s entry" : "Daily proof"}</p>
                  <h2 className="mt-1.5 text-lg font-medium sm:text-xl" id="log-title">{existingTodayShip ? "Keep today’s progress current." : "What moved forward today?"}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">Capture one thing you’ll be glad you finished.</p>
                </div>
                <span className="hidden rounded-full border border-white/[0.08] bg-black/10 px-2.5 py-1.5 text-[10px] text-muted sm:block">Ctrl + Enter</span>
              </div>
              <form onSubmit={submitShip}>
                <label className="sr-only" htmlFor="ship-body">What moved forward today?</label>
                <textarea
                className="min-h-[112px] w-full resize-y rounded-card border border-white/[0.08] bg-[#0b0b0e]/80 px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:border-indigo-300/35 focus:outline-none focus:ring-4 focus:ring-indigo-400/[0.08]"
                id="ship-body"
                maxLength={MAX_SHIP_LENGTH}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Tell the story of one small thing you moved forward…"
                ref={inputRef}
                value={body}
              />
              <fieldset className="mt-4">
                <legend className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Choose a lane <span className="normal-case tracking-normal text-muted/70">· optional</span></legend>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((option) => {
                    const Icon = CATEGORY_ICONS[option];
                    const selected = category === option;
                    const color = CATEGORY_COLORS[option];
                    return (
                      <button
                        aria-pressed={selected}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-[background-color,border-color,color,transform] hover:-translate-y-px ${selected ? "text-foreground" : "border-white/[0.08] bg-black/10 text-muted hover:border-white/[0.16] hover:text-foreground"}`}
                        key={option}
                        onClick={() => setCategory((current) => current === option ? "" : option)}
                        style={selected ? { color, borderColor: `${color}70`, backgroundColor: `${color}18` } : undefined}
                        type="button"
                      >
                        <Icon size={13} />{option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
                <button
                  className={`inline-flex min-h-10 items-center gap-2 rounded-control px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent ${showLink ? "bg-white/[0.07] text-foreground" : "text-muted hover:bg-white/[0.04] hover:text-foreground"}`}
                  onClick={() => setShowLink((value) => !value)}
                  type="button"
                >
                  {showLink ? <X size={14} /> : <Link2 size={14} />}
                  {showLink ? "Remove reference" : "Attach a reference"}
                </button>
                <span aria-live="polite" className={`ml-auto text-[11px] tabular-nums ${body.length > MAX_SHIP_LENGTH - 30 ? "text-amber-200" : "text-muted"}`}>{body.length}<span className="text-muted/60"> / {MAX_SHIP_LENGTH}</span></span>
                <Button className="min-h-11 h-11 min-w-[142px] px-4 shadow-lg shadow-indigo-950/30" disabled={submitting || !body.trim()}>
                  {submitting ? "Saving…" : existingTodayShip ? "Update entry" : "Save today’s ship"}
                  {!submitting && <ArrowRight size={14} />}
                </Button>
              </div>
              {showLink && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                  <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-muted" htmlFor="ship-link">Work reference</label>
                  <input
                    className="min-h-11 w-full rounded-control border border-white/[0.08] bg-[#0b0b0e]/80 px-3.5 text-sm text-foreground placeholder:text-muted focus:border-indigo-300/35 focus:outline-none focus:ring-2 focus:ring-indigo-400/[0.12]"
                    id="ship-link"
                    onChange={(event) => setLink(event.target.value)}
                    placeholder="Link to what you shipped"
                    inputMode="url"
                    type="text"
                    value={link}
                  />
                </div>
              )}
              {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
              {!error && <p className="mt-3 text-[10px] text-muted/80">One entry each day. You can update it as the day unfolds.</p>}
            </form>
            </div>
          </motion.section>

          <ProofTree ships={sortedShips} />

          <section aria-labelledby="timeline-title">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">The work log</p>
                <h2 className="mt-1.5 text-xl font-medium tracking-[-0.04em]" id="timeline-title">Recent ships</h2>
                <p className="mt-1 text-xs text-muted">The work, as it happened.</p>
              </div>
              <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] tabular-nums text-muted">{sortedShips.length} entries</span>
            </div>
            {sortedShips.length ? (
              <div className="space-y-2.5">
                {sortedShips.slice(0, 8).map((ship, index) => (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative flex gap-4 overflow-hidden rounded-card border border-white/[0.07] bg-gradient-to-r from-[#141418] to-[#111113] p-4 transition-colors hover:border-white/[0.13] sm:gap-5 sm:p-5"
                    initial={{ opacity: 0, y: 5 }}
                    key={ship.id}
                    transition={{ duration: 0.18, delay: Math.min(index * 0.025, 0.15), ease: "easeOut" }}
                  >
                    <div aria-hidden="true" className="absolute bottom-4 left-0 top-4 w-[2px] rounded-r-full opacity-75" style={{ backgroundColor: CATEGORY_COLORS[ship.category] }} />
                    <div className="flex w-12 shrink-0 flex-col items-center pt-0.5 text-center">
                      {ship.shipped_on === today
                        ? <span className="grid size-7 place-items-center rounded-full bg-emerald-300/10 text-emerald-200"><Check size={14} /></span>
                        : <CalendarDays className="mt-1 text-muted/80" size={15} />}
                      <time className="mt-2 text-[9px] leading-4 text-muted" dateTime={ship.shipped_on}>{dateLabel(ship.shipped_on)}</time>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-6 text-foreground sm:text-[15px]">{ship.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border px-2.5 py-1 text-[10px] font-medium" style={{ color: CATEGORY_COLORS[ship.category], borderColor: `${CATEGORY_COLORS[ship.category]}40`, backgroundColor: `${CATEGORY_COLORS[ship.category]}12` }}>{ship.category}</span>
                        {ship.link && <a className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 text-[10px] text-muted transition-colors hover:border-white/[0.16] hover:text-foreground" href={ship.link} rel="noreferrer" target="_blank">View work <ArrowUpRight size={11} /></a>}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : <TimelineEmptyState onLog={() => inputRef.current?.focus()} />}
          </section>
        </div>

        <aside className="space-y-4 lg:pt-1">
          <section className="overflow-hidden rounded-card border border-white/[0.08] bg-gradient-to-br from-[#17171d] via-surface to-[#111113] p-5" aria-labelledby="stats-title">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">Your momentum</p>
                <h2 className="mt-1.5 text-sm font-medium" id="stats-title">Progress, at a glance</h2>
              </div>
              <span className="grid size-9 place-items-center rounded-full border border-orange-200/10 bg-orange-200/[0.05]"><Flame className="text-orange-200/80" size={15} /></span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Current streak" value={stats.current} suffix="days" icon={<Flame className="text-orange-200/75" size={14} />} />
              <StatCard label="Best streak" value={stats.longest} suffix="days" icon={<Sparkles className="text-amber-200/75" size={14} />} />
              <StatCard className="col-span-2" label="Total shipped" value={stats.total} suffix="ships logged" icon={<Check className="text-emerald-200/75" size={14} />} />
            </div>
            <p className="mt-4 border-t border-white/[0.07] pt-3 text-[10px] leading-5 text-muted">A gentle record, not a score. Rest is part of the work.</p>
          </section>

          {billingNotice && <p className="rounded-card border border-amber-200/10 bg-amber-200/[0.04] p-4 text-xs leading-5 text-muted" role="status">{billingNotice}</p>}
          {isPro && <BuilderProgressCard progress={builderProgress} />}
          {isPro && <CanopyReportCard ships={ships} progress={builderProgress} today={today} />}

          <section className="rounded-card border border-white/[0.08] bg-gradient-to-br from-surface to-[#101012] p-5" aria-labelledby="profile-card-title">
            <div className="flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[15px] border border-white/[0.09] bg-gradient-to-br from-indigo-300/15 to-elevated text-sm font-medium text-foreground">
                {demoProfile.avatar_url
                  ? <Image alt="" className="size-full object-cover" height={44} src={demoProfile.avatar_url} unoptimized width={44} />
                  : demoProfile.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium" id="profile-card-title">{demoProfile.full_name}</h2>
                <p className="truncate text-xs text-muted">@{demoProfile.username}</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">{demoProfile.bio}</p>
            <Link className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control border border-white/[0.08] bg-white/[0.02] text-xs font-medium transition-colors hover:border-indigo-200/20 hover:bg-white/[0.04]" href={`/${demoProfile.username}`}>
              Preview public profile <ArrowUpRight size={13} />
            </Link>
          </section>

          {!isPro && (
            <section className="group block rounded-card border border-white/[0.08] bg-[#111113] p-5 transition-colors hover:border-white/[0.14]" aria-labelledby="pro-teaser-title">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-xs font-medium" id="pro-teaser-title"><LockKeyhole size={14} className="text-muted" /> Proof Pro</h2>
              </div>
              <p className="text-xs leading-5 text-muted">Get 30/90/365-day analytics, builder XP and levels, a monthly canopy report, extra share-card themes, and the option to remove Proof branding.</p>
              <p className="mt-3 text-[10px] leading-4 text-muted">{hasBilling ? "Update your payment method or subscription in the billing portal." : demoMode ? "Demo billing needs an account. Create one to explore Pro." : "Choose monthly or yearly billing. Cancel anytime."}</p>
              <Link className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-[#7476ff]" href={hasBilling ? "/settings#plan" : demoMode ? "/login?next=%2Fpricing" : "/pricing"}>
                {hasBilling ? "Manage billing" : demoMode ? "Create account to get Pro" : "Get Pro"} <ArrowUpRight size={13} />
              </Link>
            </section>
          )}
          {isPro && (
            <>
              <Link className="group flex min-h-11 items-center justify-between rounded-card border border-white/[0.08] bg-surface px-4 text-xs font-medium transition-colors hover:border-white/[0.15]" href="/analytics">
                View your analytics <ArrowUpRight className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={14} />
              </Link>
              {hasBilling && <Link className="group flex min-h-11 items-center justify-between rounded-card border border-white/[0.08] bg-surface px-4 text-xs font-medium transition-colors hover:border-white/[0.15]" href="/settings#plan">
                Manage billing <ArrowUpRight className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={14} />
              </Link>}
            </>
          )}
        </aside>
      </div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-control border border-white/[0.1] bg-elevated px-4 text-sm shadow-xl shadow-black/30" role="status">
          <Check className="text-foreground" size={15} />{toast}
        </div>
      )}
    </main>
  );
}

function isShip(value: unknown): value is Ship {
  if (!value || typeof value !== "object") return false;
  const ship = value as Partial<Ship>;
  return typeof ship.id === "string" && typeof ship.user_id === "string" && typeof ship.body === "string"
    && typeof ship.category === "string" && typeof ship.shipped_on === "string" && typeof ship.created_at === "string";
}

function StatCard({ label, value, suffix, icon, className }: { label: string; value: number; suffix: string; icon: ReactNode; className?: string }) {
  return (
    <div className={cn("min-h-[96px] rounded-control border border-white/[0.07] bg-black/15 p-3.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted">{label}</span>{icon}
      </div>
      <p className="mt-3 text-[25px] font-semibold leading-none tracking-[-0.06em]">{value}<span className="ml-1.5 text-[10px] font-normal tracking-normal text-muted">{suffix}</span></p>
    </div>
  );
}

function BuilderProgressCard({ progress }: { progress: ReturnType<typeof getBuilderProgress> }) {
  return (
    <section className="rounded-card border border-white/[0.08] bg-surface p-5" aria-labelledby="progress-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Pro progression</p>
          <h2 className="mt-1 text-sm font-medium" id="progress-title">Builder level {progress.level}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-2.5 py-1 text-[10px] font-medium text-amber-200">
          <Zap size={12} /> {progress.xp} XP
        </span>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-[10px] text-muted">
          <span>Progress to level {progress.level + 1}</span>
          <span>{progress.levelProgress}/250 XP</span>
        </div>
        <div
          aria-label={`${progress.levelProgress} of 250 XP to level ${progress.level + 1}`}
          aria-valuemax={250}
          aria-valuemin={0}
          aria-valuenow={progress.levelProgress}
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-amber-300 transition-[width]" style={{ width: `${(progress.levelProgress / 250) * 100}%` }} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {progress.milestones.map((milestone) => {
          const complete = milestone.progress >= milestone.goal;
          return (
            <div className={`rounded-control border p-3 ${complete ? "border-amber-200/15 bg-amber-200/[0.05]" : "border-white/[0.07] bg-background"}`} key={milestone.title}>
              <div className="flex items-center gap-1.5">
                <Award className={complete ? "text-amber-200" : "text-muted"} size={13} />
                <p className={`truncate text-[10px] font-medium ${complete ? "text-foreground" : "text-muted"}`}>{milestone.title}</p>
              </div>
              <p className="mt-1.5 text-[10px] text-muted">{complete ? "Unlocked" : `${Math.min(milestone.progress, milestone.goal)}/${milestone.goal}`}</p>
              <p className="mt-1 text-[10px] leading-4 text-muted">{milestone.description}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] leading-4 text-muted">XP celebrates showing up and exploring different kinds of work. Rest days never take points away.</p>
    </section>
  );
}

function CanopyReportCard({ ships, progress, today }: { ships: Ship[]; progress: ReturnType<typeof getBuilderProgress>; today: string }) {
  const [year, month] = today.slice(0, 7).split("-").map(Number);
  const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const currentMonthKey = today.slice(0, 7);
  const previousMonthKey = previousMonthDate.toISOString().slice(0, 7);
  const currentMonthShips = ships.filter((ship) => ship.shipped_on.startsWith(currentMonthKey)).length;
  const previousMonthShips = ships.filter((ship) => ship.shipped_on.startsWith(previousMonthKey)).length;
  const categoryCounts = new Map(CATEGORIES.map((category) => [category, ships.filter((ship) => ship.category === category).length]));
  const strongestCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const nextMilestone = progress.milestones
    .filter((milestone) => milestone.progress < milestone.goal)
    .sort((a, b) => (a.goal - a.progress) - (b.goal - b.progress))[0];
  const difference = currentMonthShips - previousMonthShips;

  return (
    <section className="rounded-card border border-emerald-200/[0.1] bg-gradient-to-br from-[#141a17] via-surface to-[#111513] p-5" aria-labelledby="canopy-report-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/70">Proof Pro · tree insights</p>
          <h2 className="mt-1 text-sm font-medium" id="canopy-report-title">Your canopy report</h2>
        </div>
        <Sparkles className="text-emerald-200/70" size={15} />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted">This month</span>
          <span className="text-xs font-medium tabular-nums">{currentMonthShips} ships <span className={difference > 0 ? "text-emerald-200" : "text-muted"}>({difference > 0 ? "+" : ""}{difference} vs last)</span></span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <span className="text-[11px] text-muted">Strongest lane</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            {strongestCategory && <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[strongestCategory[0]] }} />}
            {strongestCategory && strongestCategory[1] > 0 ? strongestCategory[0] : "Not yet established"}
          </span>
        </div>
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-[11px] text-muted">Next milestone</p>
          <p className="mt-1 text-xs font-medium">{nextMilestone ? `${nextMilestone.title} · ${Math.min(nextMilestone.progress, nextMilestone.goal)}/${nextMilestone.goal}` : "All current milestones unlocked"}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-4 text-muted">A monthly check-in on how your work is taking shape.</p>
    </section>
  );
}

function TimelineEmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-dashed border-white/[0.1] p-4">
      <div aria-hidden="true" className="space-y-4 opacity-30 blur-[1px]">
        {["Pushed a first version out into the world.", "Fixed the little thing that kept nagging me."].map((text) => (
          <div className="flex gap-3" key={text}><span className="size-8 rounded-full bg-elevated" /><div className="flex-1 pt-1"><div className="h-3 w-3/4 rounded bg-elevated" /><p className="mt-2 text-xs">{text}</p></div></div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/75">
        <button className="inline-flex min-h-11 items-center gap-1.5 rounded-control bg-accent px-4 text-xs font-medium text-white" onClick={onLog} type="button"><Plus size={14} /> Log your first ship</button>
      </div>
    </div>
  );
}
