import { getStreakStats, shiftDate } from "@/lib/streaks";
import { CATEGORIES, type Ship, type ShipCategory } from "@/lib/types";

type DatedShip = Pick<Ship, "shipped_on" | "category">;

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function countBetween(ships: DatedShip[], start: string, end: string) {
  return ships.filter((ship) => ship.shipped_on >= start && ship.shipped_on <= end).length;
}

export interface ShipConfirmation {
  streak: number;
  isFirstShip: boolean;
  last7Days: number;
  previous7Days: number;
}

// Real numbers only. "today" is the viewer's current date key; the window is today and the six days before it.
export function getShipConfirmation(ships: DatedShip[], restDays: string[], today: string, timeZone: string): ShipConfirmation {
  const stats = getStreakStats(ships, new Date(), restDays, timeZone);
  return {
    streak: stats.current,
    isFirstShip: ships.length === 1,
    last7Days: countBetween(ships, shiftDate(today, -6), today),
    previous7Days: countBetween(ships, shiftDate(today, -13), shiftDate(today, -7)),
  };
}

export function describeConfirmation(confirmation: ShipConfirmation): string[] {
  const lines: string[] = [];
  lines.push(confirmation.isFirstShip ? "Your first ship. The streak starts today." : `Current streak: ${plural(confirmation.streak, "day")}.`);
  lines.push(`${plural(confirmation.last7Days, "ship")} in the last 7 days.`);
  const difference = confirmation.last7Days - confirmation.previous7Days;
  if (confirmation.previous7Days > 0) {
    lines.push(difference === 0
      ? "That matches the 7 days before."
      : difference > 0
        ? `That's ${difference} more than the 7 days before (${confirmation.previous7Days}).`
        : `That's ${Math.abs(difference)} fewer than the 7 days before (${confirmation.previous7Days}). Slower weeks happen.`);
  }
  return lines;
}

export interface WeeklyRecap {
  startDate: string;
  endDate: string;
  total: number;
  activeDays: number;
  byCategory: { category: ShipCategory; count: number }[];
  currentStreak: number;
  bestStreak: number;
  previousTotal: number;
  goalLine: string | null;
}

// Summarises the seven days ending on endDate (inclusive).
export function buildWeeklyRecap(
  ships: DatedShip[],
  restDays: string[],
  options: { endDate: string; timeZone: string; now?: Date; goal?: string | null },
): WeeklyRecap {
  const { endDate, timeZone, goal } = options;
  const startDate = shiftDate(endDate, -6);
  const inWeek = ships.filter((ship) => ship.shipped_on >= startDate && ship.shipped_on <= endDate);
  const stats = getStreakStats(ships, options.now ?? new Date(), restDays, timeZone);
  const byCategory = CATEGORIES
    .map((category) => ({ category, count: inWeek.filter((ship) => ship.category === category).length }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const trimmedGoal = goal?.trim();

  return {
    startDate,
    endDate,
    total: inWeek.length,
    activeDays: new Set(inWeek.map((ship) => ship.shipped_on)).size,
    byCategory,
    currentStreak: stats.current,
    bestStreak: stats.longest,
    previousTotal: countBetween(ships, shiftDate(endDate, -13), shiftDate(endDate, -7)),
    goalLine: trimmedGoal
      ? inWeek.length > 0
        ? `You’re working toward “${trimmedGoal}” and logged ${plural(inWeek.length, "ship")} this week.`
        : `You’re working toward “${trimmedGoal}”. This week was quiet, and you can pick it back up whenever you’re ready.`
      : null,
  };
}

export function formatRecapRange(recap: WeeklyRecap): string {
  const format = (day: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00.000Z`));
  return `${format(recap.startDate)} – ${format(recap.endDate)}`;
}

export function describeRecapComparison(recap: WeeklyRecap): string | null {
  if (recap.previousTotal === 0) return null;
  const difference = recap.total - recap.previousTotal;
  if (difference === 0) return "Same as the week before.";
  return difference > 0 ? `${difference} more than the week before.` : `${Math.abs(difference)} fewer than the week before.`;
}

export function formatRecapEmail(recap: WeeklyRecap, links: { app: string; unsubscribe: string }): { subject: string; text: string } {
  const comparison = describeRecapComparison(recap);
  const lines = [
    `Your Proof week: ${formatRecapRange(recap)}`,
    "",
    ...(recap.goalLine ? [recap.goalLine, ""] : []),
    `Ships: ${recap.total}${comparison ? ` (${comparison.replace(/\.$/, "")})` : ""}`,
    `Days with a ship: ${recap.activeDays} of 7`,
    ...(recap.byCategory.length ? ["", "By category:", ...recap.byCategory.map((entry) => `  ${entry.category}: ${entry.count}`)] : []),
    "",
    `Current streak: ${plural(recap.currentStreak, "day")} · Best streak: ${plural(recap.bestStreak, "day")}`,
    "",
    `Open Proof: ${links.app}`,
    "",
    "You’re getting this because you turned on the weekly recap in Settings.",
    `Unsubscribe from the weekly recap: ${links.unsubscribe}`,
  ];
  return { subject: `Your Proof week: ${plural(recap.total, "ship")}`, text: lines.join("\n") };
}

export function localWeekday(now: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en", { timeZone, weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

export function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(`${later}T12:00:00.000Z`) - Date.parse(`${earlier}T12:00:00.000Z`)) / 86_400_000);
}
