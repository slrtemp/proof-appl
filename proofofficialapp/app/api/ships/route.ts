import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, type ShipCategory } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to save a ship to your account." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON ship." }, { status: 400 });
  }

  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Send a valid ship." }, { status: 400 });
  }
  const payload = input as Record<string, unknown>;
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const category = payload.category;
  const link = payload.link;

  if (!body || body.length > 280) {
    return NextResponse.json({ error: "A ship must be between 1 and 280 characters." }, { status: 400 });
  }
  if (category !== null && category !== undefined && !CATEGORIES.includes(category as ShipCategory)) {
    return NextResponse.json({ error: "Choose a valid ship category." }, { status: 400 });
  }

  let normalizedLink: string | null = null;
  if (link !== null && link !== undefined && link !== "") {
    if (typeof link !== "string" || link.length > 2048) {
      return NextResponse.json({ error: "The ship link is invalid." }, { status: 400 });
    }
    try {
      const parsed = new URL(link);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Unsupported URL scheme.");
      normalizedLink = parsed.toString();
    } catch {
      return NextResponse.json({ error: "Enter a valid http or https link." }, { status: 400 });
    }
  }

  const shippedOn = new Date().toISOString().slice(0, 10);
  const { data: ship, error } = await supabase
    .from("ships")
    .upsert({
      user_id: user.id,
      body,
      category: category ?? "Code",
      link: normalizedLink,
      shipped_on: shippedOn,
    }, { onConflict: "user_id,shipped_on" })
    .select("id,user_id,body,category,link,shipped_on,created_at")
    .single();

  if (error) {
    console.error("Could not save ship.", error);
    return NextResponse.json({ error: "Your ship could not be saved. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ship }, { status: 200 });
}
