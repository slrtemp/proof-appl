import { shiftDate } from "@/lib/streaks";

const CELL = 11;
const GAP = 3;
const WEEKS = 26;
const PAD = 16;
const HEADER = 34;

const THEMES = {
  dark: { bg: "#0A0A0B", border: "#26262c", text: "#EDEDEF", muted: "#8A8A93", levels: ["#1b1b21", "#3b3f8f", "#5b61d6", "#818cf8", "#c7d2fe"] },
  light: { bg: "#FFFFFF", border: "#d8d8e0", text: "#16161a", muted: "#6b6b76", levels: ["#ebebf0", "#c7d2fe", "#a5b4fc", "#6366f1", "#3730a3"] },
} as const;

export type EmbedTheme = keyof typeof THEMES;

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
}

// Builds a self-contained SVG of the last 26 weeks. Counts are real ships per day (rest days are not drawn).
export function buildActivityMapSvg(options: {
  username: string;
  shipDates: string[];
  today: string;
  total: number;
  currentStreak: number;
  profileUrl: string;
  theme: EmbedTheme;
}): string {
  const colors = THEMES[options.theme];
  const counts = new Map<string, number>();
  for (const day of options.shipDates) counts.set(day, (counts.get(day) ?? 0) + 1);

  const end = new Date(`${options.today}T12:00:00.000Z`);
  const lastWeekStart = shiftDate(options.today, -end.getUTCDay());
  const firstWeekStart = shiftDate(lastWeekStart, -7 * (WEEKS - 1));

  const cells: string[] = [];
  for (let week = 0; week < WEEKS; week += 1) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = shiftDate(firstWeekStart, week * 7 + weekday);
      if (day > options.today) continue;
      const count = counts.get(day) ?? 0;
      const level = count === 0 ? 0 : count === 1 ? 2 : count === 2 ? 3 : 4;
      const x = PAD + week * (CELL + GAP);
      const y = HEADER + PAD / 2 + weekday * (CELL + GAP);
      cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${colors.levels[level]}"><title>${day}: ${count} ${count === 1 ? "ship" : "ships"}</title></rect>`);
    }
  }

  const width = PAD * 2 + WEEKS * (CELL + GAP) - GAP;
  const height = HEADER + PAD / 2 + 7 * (CELL + GAP) - GAP + PAD;
  const summary = `${options.total} ${options.total === 1 ? "ship" : "ships"} · ${options.currentStreak} day streak`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(`@${options.username} on Proof: ${summary}`)}">
<a href="${escapeXml(options.profileUrl)}" target="_blank">
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${colors.bg}" stroke="${colors.border}"/>
<text x="${PAD}" y="${PAD + 10}" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700" fill="${colors.text}">proof · @${escapeXml(options.username)}</text>
<text x="${width - PAD}" y="${PAD + 10}" text-anchor="end" font-family="Inter,Arial,sans-serif" font-size="11" fill="${colors.muted}">${escapeXml(summary)}</text>
${cells.join("\n")}
</a>
</svg>`;
}
