export const CATEGORIES = ["Code", "Design", "Marketing", "Launch", "Learning"] as const;
export type ShipCategory = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<ShipCategory, string> = {
  Code: "#818cf8",
  Design: "#f472b6",
  Marketing: "#fbbf24",
  Launch: "#4ade80",
  Learning: "#38bdf8",
};

export interface Ship {
  id: string;
  user_id: string;
  body: string;
  category: ShipCategory;
  link: string | null;
  shipped_on: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  tagline: string;
  bio: string;
  location: string;
  website: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface StreakStats {
  current: number;
  longest: number;
  total: number;
  days: Set<string>;
}
