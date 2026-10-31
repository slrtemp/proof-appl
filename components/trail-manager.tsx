"use client";

import { useState } from "react";

import { dateLabel } from "@/lib/streaks";

interface TrailItem { id: string; slug: string; title: string; description: string }
interface ShipItem { id: string; body: string; shipped_on: string; trailId: string | null }

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const result = await response.json() as { error?: string; trail?: TrailItem };
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

const field = "min-h-11 w-full rounded-control border border-white/[0.08] bg-background px-3 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function TrailManager({ username, initialTrails, initialShips }: { username: string; initialTrails: TrailItem[]; initialShips: ShipItem[] }) {
  const [trails, setTrails] = useState(initialTrails);
  const [ships, setShips] = useState(initialShips);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const createTrail = () => run(async () => {
    const { trail } = await request("/api/trails", { method: "POST", body: JSON.stringify({ title, description }) });
    if (trail) setTrails((current) => [trail, ...current]);
    setTitle("");
    setDescription("");
  });

  const deleteTrail = (trail: TrailItem) => run(async () => {
    if (!window.confirm(`Delete the trail “${trail.title}”? Your ships stay on your profile.`)) return;
    await request(`/api/trails?id=${trail.id}`, { method: "DELETE" });
    setTrails((current) => current.filter((item) => item.id !== trail.id));
    setShips((current) => current.map((ship) => (ship.trailId === trail.id ? { ...ship, trailId: null } : ship)));
  });

  const assign = (shipId: string, trailId: string | null) => run(async () => {
    await request("/api/trails/assign", { method: "POST", body: JSON.stringify({ shipId, trailId }) });
    setShips((current) => current.map((ship) => (ship.id === shipId ? { ...ship, trailId } : ship)));
  });

  return (
    <div className="space-y-8">
      {error && <p className="rounded-control border border-red-200/10 bg-red-200/[0.04] p-3 text-xs text-red-100" role="alert">{error}</p>}

      <section aria-labelledby="new-trail">
        <h2 className="text-sm font-medium" id="new-trail">Start a trail</h2>
        <p className="mt-1 text-xs leading-5 text-muted">A trail is a public timeline for one project, like “Launching my app”.</p>
        <div className="mt-3 space-y-2">
          <input aria-label="Trail title" className={field} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder="Trail title" value={title} />
          <input aria-label="Trail description" className={field} maxLength={280} onChange={(event) => setDescription(event.target.value)} placeholder="One line about it (optional)" value={description} />
          <button className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-[#7476ff] disabled:opacity-50" disabled={busy || !title.trim()} onClick={() => void createTrail()} type="button">Create trail</button>
        </div>
      </section>

      <section aria-labelledby="your-trails">
        <h2 className="text-sm font-medium" id="your-trails">Your trails</h2>
        {trails.length === 0 ? <p className="mt-2 text-xs text-muted">No trails yet.</p> : (
          <ul className="mt-3 space-y-2">
            {trails.map((trail) => (
              <li className="flex items-center justify-between gap-3 rounded-control border border-white/[0.08] p-3" key={trail.id}>
                <div className="min-w-0">
                  <a className="block truncate text-sm font-medium hover:underline" href={`/${username}/trails/${trail.slug}`}>{trail.title}</a>
                  <p className="text-[11px] text-muted">{ships.filter((ship) => ship.trailId === trail.id).length} of your recent ships</p>
                </div>
                <button className="min-h-11 px-2 text-xs text-muted hover:text-red-200 disabled:opacity-50" disabled={busy} onClick={() => void deleteTrail(trail)} type="button">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="assign-ships">
        <h2 className="text-sm font-medium" id="assign-ships">Put ships on a trail</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Each ship can be on one trail. Your most recent 60 ships are shown.</p>
        {ships.length === 0 ? <p className="mt-2 text-xs text-muted">Log a ship first.</p> : (
          <ul className="mt-3 space-y-2">
            {ships.map((ship) => (
              <li className="flex flex-col gap-2 rounded-control border border-white/[0.08] p-3 sm:flex-row sm:items-center" key={ship.id}>
                <div className="min-w-0 flex-1"><p className="truncate text-sm">{ship.body}</p><p className="text-[11px] text-muted">{dateLabel(ship.shipped_on)}</p></div>
                <select aria-label={`Trail for ${ship.body}`} className="min-h-11 rounded-control border border-white/[0.08] bg-background px-2 text-xs" disabled={busy || trails.length === 0} onChange={(event) => void assign(ship.id, event.target.value || null)} value={ship.trailId ?? ""}>
                  <option value="">No trail</option>
                  {trails.map((trail) => <option key={trail.id} value={trail.id}>{trail.title}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
