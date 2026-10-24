import type { Ship, StreakStats } from "@/lib/types";

function shiftDate(day: string, offset: number): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function getStreakStats(ships: Ship[], today = new Date()): StreakStats {
  const days = new Set(ships.map((ship) => ship.shipped_on));
  const todayKey = today.toISOString().slice(0, 10);
  const startingDay = days.has(todayKey) ? todayKey : shiftDate(todayKey, -1);

  let current = 0;
  if (days.has(startingDay)) {
    let day = startingDay;
    while (days.has(day)) {
      current += 1;
      day = shiftDate(day, -1);
    }
  }

  let longest = 0;
  let run = 0;
  const sortedDays = Array.from(days).sort();
  let previousDay: string | undefined;
  for (const day of sortedDays) {
    run = previousDay && shiftDate(previousDay, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previousDay = day;
  }

  return { current, longest, total: ships.length, days };
}

export function getHeatmapWeeks(_ships: Ship[], today = new Date()): string[][] {
  const endKey = today.toISOString().slice(0, 10);
  const end = new Date(`${endKey}T12:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 363);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: string[][] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const week: string[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const key = cursor.toISOString().slice(0, 10);
      week.push(key);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks.slice(-52);
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}
