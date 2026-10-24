"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function BillingButton({ plan }: { plan: "monthly" | "yearly" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function startCheckout() {
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
        router.push("/login");
        return;
      }
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button className="w-full" disabled={busy} onClick={startCheckout} type="button">
        {busy ? "Opening secure checkout…" : "Choose Pro"}
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
