import type { Ship, StreakStats } from "@/lib/types";

const XP_PER_SHIP = 10;
const XP_PER_STREAK_DAY = 5;
const XP_PER_CATEGORY = 15;
const XP_PER_LEVEL = 250;

export interface Milestone {
  title: string;
  description: string;
  progress: number;
  goal: number;
}

export interface BuilderProgress {
  xp: number;
  level: number;
  levelProgress: number;
  milestones: Milestone[];
}

export function getBuilderProgress(ships: Ship[], stats: StreakStats): BuilderProgress {
  const categories = new Set(ships.map((ship) => ship.category));
  const xp = ships.length * XP_PER_SHIP + stats.longest * XP_PER_STREAK_DAY + categories.size * XP_PER_CATEGORY;
  const milestones: Milestone[] = [
    { title: "First ship", description: "Log your first piece of work.", progress: ships.length, goal: 1 },
    { title: "One-week streak", description: "Show up seven days in a row.", progress: stats.longest, goal: 7 },
    { title: "30 ships", description: "Build a body of work, one day at a time.", progress: ships.length, goal: 30 },
    { title: "Category explorer", description: "Ship in every work category.", progress: categories.size, goal: 5 },
  ];

  return {
    xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelProgress: xp % XP_PER_LEVEL,
    milestones,
  };
}
