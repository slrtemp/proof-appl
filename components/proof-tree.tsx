"use client";

import { CATEGORIES, CATEGORY_COLORS, type Ship } from "@/lib/types";

const LEAF_POSITIONS = [
  [310, 77, -35], [278, 91, 15], [342, 92, -10], [247, 108, 25], [370, 108, -28],
  [306, 111, 12], [333, 126, -35], [218, 132, -10], [264, 136, -32], [355, 145, 18],
  [397, 132, -15], [293, 148, 25], [326, 160, -15], [238, 164, -30], [373, 171, 28],
  [190, 165, 10], [277, 176, 15], [344, 187, -28], [414, 166, -20], [310, 191, 22],
  [226, 198, -15], [262, 207, 30], [390, 202, 10], [348, 215, -18], [296, 218, -30],
  [180, 207, -25], [431, 201, 20], [235, 229, 12], [321, 234, 18], [377, 230, -25],
  [278, 245, -20], [405, 235, 30], [201, 241, 15], [345, 249, -12], [250, 258, -25],
  [304, 265, 15], [370, 264, 20], [427, 235, -15], [161, 222, 10], [449, 188, -25],
  [293, 87, 28], [355, 78, -20], [236, 143, 18], [385, 153, -5], [201, 185, 25],
  [415, 187, -30], [248, 184, -12], [329, 204, 32], [385, 220, -10], [218, 215, -32],
  [326, 281, -20], [264, 276, 28], [396, 252, -35], [184, 226, -5], [440, 218, 12],
  [281, 123, -25], [360, 126, 25], [315, 173, -10], [232, 246, 20], [355, 238, -32],
] as const;

export function ProofTree({ ships }: { ships: Ship[] }) {
  const visibleLeaves = Math.min(ships.length, LEAF_POSITIONS.length);
  const leaves = Array.from({ length: visibleLeaves }, (_, index) => {
    const shipIndex = visibleLeaves === ships.length
      ? index
      : Math.floor((index * ships.length) / visibleLeaves);
    return { position: LEAF_POSITIONS[index], category: ships[shipIndex].category, index };
  });

  return (
    <section className="overflow-hidden rounded-card border border-white/[0.08] bg-gradient-to-br from-[#15191a] via-[#111415] to-[#101213] p-5 sm:p-6" aria-labelledby="proof-tree-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/75">A living record</p>
          <h2 className="mt-1.5 text-lg font-medium" id="proof-tree-title">Your Proof tree</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Each ship adds a leaf. Keep growing at your own pace.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/[0.08] bg-black/10 px-3 py-1.5 text-[10px] tabular-nums text-muted">
          {ships.length} {ships.length === 1 ? "ship" : "ships"}
        </span>
      </div>

      <div className="relative mx-auto mt-1 max-w-[560px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[18%] top-[12%] h-2/3 rounded-full bg-emerald-300/[0.06] blur-3xl" />
        <svg
          aria-label={`A growing tree with ${visibleLeaves} leaves representing ${ships.length} ships logged`}
          className="proof-tree relative w-full"
          role="img"
          viewBox="0 0 620 390"
        >
          <defs>
            <linearGradient id="proof-tree-trunk" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#9b7450" />
              <stop offset="0.55" stopColor="#705039" />
              <stop offset="1" stopColor="#49382e" />
            </linearGradient>
            <linearGradient id="proof-tree-ground" x1="0" x2="1">
              <stop offset="0" stopColor="#4c6550" stopOpacity=".15" />
              <stop offset=".5" stopColor="#80946e" stopOpacity=".42" />
              <stop offset="1" stopColor="#4c6550" stopOpacity=".15" />
            </linearGradient>
          </defs>
          <path d="M108 357 Q310 339 512 357" fill="none" stroke="url(#proof-tree-ground)" strokeLinecap="round" strokeWidth="2" />
          <path d="M309 353 C306 313 313 280 307 244 C300 210 306 174 310 137 C312 118 307 100 312 83" fill="none" stroke="url(#proof-tree-trunk)" strokeLinecap="round" strokeWidth="17" />
          <path d="M309 292 C285 270 268 246 251 217 C235 190 208 178 180 169" fill="none" stroke="#72513a" strokeLinecap="round" strokeWidth="10" />
          <path d="M308 265 C335 244 355 222 373 194 C391 170 416 157 444 151" fill="none" stroke="#72513a" strokeLinecap="round" strokeWidth="10" />
          <path d="M308 225 C284 203 275 177 272 146 C269 126 255 111 238 100" fill="none" stroke="#805b3f" strokeLinecap="round" strokeWidth="7" />
          <path d="M310 199 C331 178 338 153 340 128 C344 108 361 96 377 87" fill="none" stroke="#805b3f" strokeLinecap="round" strokeWidth="7" />
          <path d="M307 326 C289 343 275 353 257 358 M312 326 C331 344 346 352 365 358" fill="none" stroke="#604633" strokeLinecap="round" strokeWidth="6" />
          <g className="proof-tree-crown">
            {leaves.map(({ position: [x, y, rotation], category, index }) => (
              <path
                className="proof-tree-leaf"
                d="M0 0 C-2-7 3-14 12-16 C15-8 11-1 0 0Z"
                fill={CATEGORY_COLORS[category]}
                key={`${x}-${y}`}
                opacity=".9"
                style={{ animationDelay: `${(index % 9) * -0.18}s` }}
                transform={`translate(${x} ${y}) rotate(${rotation})`}
              />
            ))}
          </g>
          {ships.length === 0 && (
            <g aria-hidden="true">
              <path d="M311 105 C296 94 293 82 296 71 C309 75 316 86 311 105Z" fill="#4ade80" opacity=".8" />
              <path d="M313 106 C322 92 333 89 343 92 C339 104 328 110 313 106Z" fill="#38bdf8" opacity=".8" />
            </g>
          )}
        </svg>
        <p className="sr-only">
          Each leaf represents a logged ship. The leaf colors correspond to Code, Design, Marketing, Launch, and Learning.
          {ships.length === 0 ? " The tree is ready for its first leaf." : ` There are ${ships.length} ships in this record.`}
        </p>
      </div>

      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-3" aria-label="Tree leaf work categories">
        {CATEGORIES.map((category) => (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted" key={category}>
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
            {category}
          </span>
        ))}
      </div>
    </section>
  );
}
