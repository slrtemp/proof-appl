"use client";

import { useEffect } from "react";

export function trackEvent(event: "profile_viewed" | "card_shared", username: string) {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, username }),
    keepalive: true,
  }).catch(() => undefined);
}

// Counts at most one view per profile per browser tab session.
export function ProfileViewBeacon({ username }: { username: string }) {
  useEffect(() => {
    const key = `proof-viewed:${username}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    trackEvent("profile_viewed", username);
  }, [username]);
  return null;
}
