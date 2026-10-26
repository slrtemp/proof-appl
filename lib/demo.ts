import type { Profile, Ship, ShipCategory } from "@/lib/types";

export const DEMO_PROFILE: Profile = {
  id: "demo-alex",
  username: "alex-morgan",
  full_name: "Alex Morgan",
  tagline: "Making small tools for a more thoughtful internet.",
  bio: "Indie builder making small tools for a more thoughtful internet.",
  location: "Brooklyn, NY",
  website: null,
  avatar_url: null,
  is_pro: false,
  is_verified: false,
  created_at: "2024-01-01T12:00:00.000Z",
};

const demoDays = [
  [0, "Shipped a calmer way to plan my week.", "Design"],
  [1, "Added keyboard shortcuts to the command menu.", "Code"],
  [2, "Shared the beta with 12 early testers.", "Launch"],
  [3, "Wrote the first draft of the onboarding emails.", "Marketing"],
  [5, "Learned how optimistic updates feel in practice.", "Learning"],
  [6, "Polished the empty state for new workspaces.", "Design"],
  [7, "Fixed a timezone edge case in daily summaries.", "Code"],
  [9, "Published the tiny habits field guide.", "Launch"],
  [10, "Reworked the landing page headline.", "Marketing"],
  [12, "Made recurring tasks easier to understand.", "Design"],
  [13, "Cut the first-load JS bundle by 18%.", "Code"],
  [15, "Ran five interviews with independent makers.", "Learning"],
  [16, "Opened the private beta to the waitlist.", "Launch"],
  [18, "Added an export button for all user data.", "Code"],
  [19, "Sent the monthly product notes.", "Marketing"],
  [21, "Built a more useful search experience.", "Code"],
  [22, "Explored a type scale for compact screens.", "Design"],
  [24, "Released saved views for project boards.", "Launch"],
  [25, "Learned to keep database migrations reversible.", "Learning"],
  [27, "Simplified the first-run setup.", "Design"],
  [28, "Added rate limits to the public endpoint.", "Code"],
  [30, "Published a short demo for the community.", "Marketing"],
  [31, "Shipped bulk archive for completed work.", "Code"],
  [32, "Took a day to map the next quarter.", "Learning"],
  [34, "Released the redesigned activity feed.", "Launch"],
  [35, "Cut a redundant confirmation step.", "Design"],
  [37, "Added searchable notes to each project.", "Code"],
  [38, "Wrote down the support playbook.", "Marketing"],
  [40, "Made the mobile nav easier to reach.", "Design"],
  [41, "Shared the roadmap with early customers.", "Launch"],
  [43, "Improved keyboard navigation across forms.", "Code"],
  [44, "Studied how to write clearer error messages.", "Learning"],
  [46, "Opened the first public changelog.", "Marketing"],
  [47, "Added a quick-add action from anywhere.", "Code"],
  [48, "Shipped the new project overview.", "Launch"],
  [49, "Designed a better empty state.", "Design"],
  [50, "Made billing settings easier to find.", "Code"],
  [51, "Published a guide to async collaboration.", "Marketing"],
] as const;

function dateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function createDemoShips(): Ship[] {
  return demoDays.map(([daysAgo, body, category], index) => {
    const shippedOn = dateDaysAgo(daysAgo);
    return {
      id: `demo-${daysAgo}-${index}`,
      user_id: DEMO_PROFILE.id,
      body,
      category: category as ShipCategory,
      link: null,
      shipped_on: shippedOn,
      created_at: `${shippedOn}T16:30:00.000Z`,
    };
  });
}

export const DEMO_SHIPS = createDemoShips();
