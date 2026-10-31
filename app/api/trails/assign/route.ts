import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

// Puts one of your ships on a trail, or removes it from its trail when trailId is null.
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Trails are not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage trails." }, { status: 401 });

  let payload: { shipId?: unknown; trailId?: unknown };
  try {
    payload = await request.json() as { shipId?: unknown; trailId?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid request." }, { status: 400 });
  }
  const { shipId, trailId } = payload;
  if (typeof shipId !== "string" || !UUID.test(shipId) || (trailId !== null && (typeof trailId !== "string" || !UUID.test(trailId)))) {
    return NextResponse.json({ error: "Choose a ship and a trail." }, { status: 400 });
  }

  const { data: ship } = await admin.from("ships").select("id").eq("id", shipId).eq("user_id", user.id).maybeSingle();
  if (!ship) return NextResponse.json({ error: "Ship not found." }, { status: 404 });

  if (trailId === null) {
    const { error } = await admin.from("trail_ships").delete().eq("ship_id", shipId);
    if (error) {
      console.error("Could not remove a ship from its trail.", error);
      return NextResponse.json({ error: "The ship could not be updated." }, { status: 500 });
    }
    return NextResponse.json({ shipId, trailId: null });
  }

  const { data: trail } = await admin.from("trails").select("id").eq("id", trailId).eq("user_id", user.id).maybeSingle();
  if (!trail) return NextResponse.json({ error: "Trail not found." }, { status: 404 });

  const { error } = await admin.from("trail_ships").upsert({ ship_id: shipId, trail_id: trailId }, { onConflict: "ship_id" });
  if (error) {
    console.error("Could not add a ship to a trail.", error);
    return NextResponse.json({ error: "The ship could not be updated." }, { status: 500 });
  }
  return NextResponse.json({ shipId, trailId });
}
