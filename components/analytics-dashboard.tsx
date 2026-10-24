"use client";

import { useMemo, useState } from "react";
import { Download, TrendingDown, TrendingUp } from "lucide-react";

import { CATEGORY_COLORS, CATEGORIES, type Ship } from "@/lib/types";

const RANGES = [30, 90, 365] as const;
type RangeDays = (typeof RANGES)[number];

export function AnalyticsDashboard({ ships, today }: { ships: Ship[]; today: string }) {
  const [range, setRange] = useState<RangeDays>(30);
  const report = useMemo(() => buildReport(ships, today, range), [ships, today, range]);

  function downloadReport() {
    const rows = [
      ["Date", "Category", "Work shipped", "Link"],
      ...report.currentShips.map((ship) => [ship.shipped_on, ship.category, ship.body, ship.link ?? ""]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `proof-analytics-${range}d-${today}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const compareText = (current: number, previous: number, suffix = "") => {
    const difference = current - previous;
    if (difference === 0) return `No change vs previous ${range} days`;
    return `${difference > 0 ? "+" : ""}${Number(difference.toFixed(1))}${suffix} vs previous ${range} days`;
  };

  return (
    <>
      <section className="mb-4 flex flex-col justify-between gap-3 rounded-card border border-white/[0.08] bg-surface p-4 sm:flex-row sm:items-center sm:p-5" aria-label="Analytics controls">
        <div>
          <h2 className="text-sm font-medium">Choose your reporting window</h2>
          <p className="mt-1 text-xs text-muted">Compare your pace with the period immediately before it.</p>
        </div>
        <div className="flex items-center gap-1 rounded-control border border-white/[0.08] bg-background p-1" aria-label="Date range">
          {RANGES.map((days) => (
            <button
              aria-pressed={range === days}
              className={`min-h-9 rounded px-3 text-xs font-medium transition-colors ${range === days ? "bg-elevated text-foreground" : "text-muted hover:text-foreground"}`}
              key={days}
              onClick={() => setRange(days)}
              type="button"
            >
              {days === 365 ? "1 year" : `${days} days`}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Metric label={`Ships · ${range} days`} value={report.currentShips.length} comparison={compareText(report.currentShips.length, report.previousShips.length)} />
        <Metric label="Consistency" value={`${report.consistency}%`} comparison={compareText(report.consistency - report.previousConsistency, 0, " pp")} />
        <Metric label="Weekly pace" value={report.weeklyPace.toFixed(1)} suffix="ships" comparison={compareText(report.weeklyPace, report.previousWeeklyPace)} />
        <Metric label="Top category" value={report.topCategory ?? "—"} comparison={report.topCategory ? `${report.categoryCounts.get(report.topCategory) ?? 0} ships in this period` : "Log a ship to get started"} />
      </div>

      <section className="mt-4 rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6" aria-labelledby="trend-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium" id="trend-title">Your shipping rhythm</h2>
            <p className="mt-1 text-xs text-muted">{report.start} – {today} · {report.bucketLabel.toLowerCase()} view</p>
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-control border border-white/[0.08] px-3 text-xs font-medium text-muted transition-colors hover:border-white/[0.15] hover:text-foreground" onClick={downloadReport} type="button">
            <Download size={14} /> Download CSV
          </button>
        </div>
        <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label={`${report.bucketLabel} chart showing ships over the selected ${range}-day period`}>
          {report.buckets.map((bucket) => (
            <div className="group flex h-full min-w-0 flex-1 flex-col justify-end" key={bucket.label} title={`${bucket.label}: ${bucket.count} ${bucket.count === 1 ? "ship" : "ships"}`}>
              <span className={`w-full rounded-t-sm transition-colors ${bucket.count ? "bg-indigo-400/60 group-hover:bg-indigo-300" : "bg-white/[0.06]"}`} style={{ height: `${Math.max(bucket.count ? 10 : 3, (bucket.count / report.maxBucketCount) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-muted"><span>{report.buckets[0]?.label}</span><span>{report.buckets[report.buckets.length - 1]?.label}</span></div>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6" aria-labelledby="category-title">
          <div className="mb-4">
            <h2 className="text-sm font-medium" id="category-title">Where your work goes</h2>
            <p className="mt-1 text-xs text-muted">Category mix for the selected period.</p>
          </div>
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const count = report.categoryCounts.get(category) ?? 0;
              const share = report.currentShips.length ? (count / report.currentShips.length) * 100 : 0;
              return (
                <div key={category}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="inline-flex items-center gap-2"><span className="size-2 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[category] }} />{category}</span>
                    <span className="tabular-nums text-muted">{count} <span className="ml-1 text-muted/70">{Math.round(share)}%</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${share}%`, backgroundColor: CATEGORY_COLORS[category] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6" aria-labelledby="weekday-title">
          <div className="mb-4">
            <h2 className="text-sm font-medium" id="weekday-title">Your natural rhythm</h2>
            <p className="mt-1 text-xs text-muted">{report.bestWeekday ? `You ship most often on ${report.bestWeekday}.` : "Your most active days of the week."}</p>
          </div>
          <div className="space-y-3">
            {report.weekdays.map(({ name, count }) => (
              <div className="flex items-center gap-3" key={name}>
                <span className="w-8 text-[11px] text-muted">{name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-sky-300/70 transition-[width]" style={{ width: `${report.maxWeekdayCount ? (count / report.maxWeekdayCount) * 100 : 0}%` }} />
                </div>
                <span className="w-5 text-right text-[11px] tabular-nums text-muted">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] leading-5 text-muted">
        <TrendingUp aria-hidden="true" size={13} /> Insights are based on your logged ships. Your history is yours to export at any time.
      </p>
    </>
  );
}

function buildReport(ships: Ship[], today: string, range: RangeDays) {
  const start = shiftDate(today, -(range - 1));
  const previousStart = shiftDate(start, -range);
  const previousEnd = shiftDate(start, -1);
  const currentShips = ships.filter((ship) => ship.shipped_on >= start && ship.shipped_on <= today);
  const previousShips = ships.filter((ship) => ship.shipped_on >= previousStart && ship.shipped_on <= previousEnd);
  const activeDays = new Set(currentShips.map((ship) => ship.shipped_on)).size;
  const previousActiveDays = new Set(previousShips.map((ship) => ship.shipped_on)).size;
  const categoryCounts = new Map(CATEGORIES.map((category) => [category, 0]));
  const weekdayCounts = new Array<number>(7).fill(0);

  for (const ship of currentShips) {
    categoryCounts.set(ship.category, (categoryCounts.get(ship.category) ?? 0) + 1);
    const weekday = new Date(`${ship.shipped_on}T12:00:00.000Z`).getUTCDay();
    weekdayCounts[weekday] += 1;
  }

  const topCategory = CATEGORIES
    .filter((category) => (categoryCounts.get(category) ?? 0) > 0)
    .sort((a, b) => (categoryCounts.get(b) ?? 0) - (categoryCounts.get(a) ?? 0))[0] ?? null;
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdays = weekdayNames.map((name, index) => ({ name, count: weekdayCounts[index] }));
  const maxWeekdayCount = Math.max(0, ...weekdayCounts);
  const bestWeekday = maxWeekdayCount ? weekdays.find((day) => day.count === maxWeekdayCount)?.name ?? null : null;
  const interval = range === 30 ? 1 : range === 90 ? 7 : 30;
  const bucketLabel = range === 30 ? "Daily" : range === 90 ? "Weekly" : "Monthly";
  const bucketCount = Math.ceil(range / interval);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = shiftDate(start, index * interval);
    const bucketEnd = shiftDate(start, Math.min((index + 1) * interval, range) - 1);
    const count = currentShips.filter((ship) => ship.shipped_on >= bucketStart && ship.shipped_on <= bucketEnd).length;
    const date = new Date(`${bucketStart}T12:00:00.000Z`);
    const label = new Intl.DateTimeFormat("en", { month: "short", day: range === 30 ? "numeric" : undefined, timeZone: "UTC" }).format(date);
    return { label, count };
  });

  return {
    start,
    currentShips,
    previousShips,
    consistency: Math.round((activeDays / range) * 100),
    previousConsistency: Math.round((previousActiveDays / range) * 100),
    weeklyPace: (currentShips.length / range) * 7,
    previousWeeklyPace: (previousShips.length / range) * 7,
    categoryCounts,
    topCategory,
    weekdays,
    maxWeekdayCount,
    bestWeekday,
    buckets,
    bucketLabel,
    maxBucketCount: Math.max(1, ...buckets.map((bucket) => bucket.count)),
  };
}

function shiftDate(day: string, offset: number): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function csvCell(value: string): string {
  const safeValue = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function Metric({ label, value, suffix, comparison }: { label: string; value: string | number; suffix?: string; comparison: string }) {
  const positive = comparison.startsWith("+");
  const negative = comparison.startsWith("-");
  const TrendIcon = positive ? TrendingUp : negative ? TrendingDown : null;
  return (
    <div className="min-h-28 rounded-card border border-white/[0.08] bg-surface p-4">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.06em]">{value}{suffix && <span className="ml-1.5 text-xs font-normal tracking-normal text-muted">{suffix}</span>}</p>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-muted">
        {TrendIcon && <TrendIcon aria-hidden="true" className={positive ? "text-emerald-300" : "text-rose-300"} size={12} />}
        <span className="truncate">{comparison}</span>
      </p>
    </div>
  );
}
