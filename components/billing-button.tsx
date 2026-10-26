"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BillingButton({ plan, signedIn = false, autoStart = false }: { plan: "monthly" | "yearly"; signedIn?: boolean; autoStart?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const autoStarted = useRef(false);

  const startCheckout = useCallback(async () => {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/pricing?checkout=${plan}`)}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json() as { url?: string; error?: string };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/pricing?checkout=${plan}`)}`);
        return;
      }
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setBusy(false);
    }
  }, [plan, router, signedIn]);

  useEffect(() => {
    if (!autoStart || !signedIn || autoStarted.current) return;
    autoStarted.current = true;
    void startCheckout();
  }, [autoStart, signedIn, startCheckout]);

  return (
    <div>
      <Button className="w-full" disabled={busy} onClick={startCheckout} type="button">
        {busy ? "Opening secure checkout…" : "Get Pro"}
        {!busy && <ArrowRight size={15} />}
      </Button>
      {error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
    </div>
  );
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function openPortal() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Billing portal could not be opened.");
      window.location.assign(result.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Billing portal could not be opened.");
      setBusy(false);
    }
  }

  return <div><Button onClick={openPortal} variant="secondary" disabled={busy}>{busy ? "Opening portal…" : "Manage billing"}</Button>{error && <p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}</div>;
}
