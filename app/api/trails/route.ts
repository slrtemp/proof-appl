import { NextResponse } from "next/server";

import { slugifyTrailTitle } from "@/lib/trails";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_TRAILS = 20;

async function getContext() {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return { error: NextResponse.json({ error: "Trails are not configured." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in to manage trails." }, { status: 401 }) };
  return { admin, user };
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : null;
}

export async function POST(request: Request) {
  const context = await getContext();
  if ("error" in context) return context.error;
  const { admin, user } = context;

  let payload: { title?: unknown; description?: unknown };
  try {
    payload = await request.json() as { title?: unknown; description?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid trail." }, { status: 400 });
  }
  const title = clean(payload.title, 60);
  const description = payload.description === undefined ? "" : clean(payload.description, 280);
  if (!title || description === null) return NextResponse.json({ error: "Give the trail a title up to 60 characters and a description up to 280." }, { status: 400 });

  const { data: existing, error: existingError } = await admin.from("trails").select("slug").eq("user_id", user.id).limit(MAX_TRAILS + 1);
  if (existingError) {
    console.error("Could not check existing Proof trails.", existingError);
    return NextResponse.json({ error: "Your trail could not be created." }, { status: 500 });
  }
  if ((existing ?? []).length >= MAX_TRAILS) return NextResponse.json({ error: `You can have up to ${MAX_TRAILS} trails.` }, { status: 409 });

  const taken = new Set((existing ?? []).map((trail) => trail.slug));
  const base = slugifyTrailTitle(title);
  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base.slice(0, 36)}-${suffix}`;

  const { data: trail, error } = await admin
    .from("trails")
    .insert({ user_id: user.id, slug, title, description })
    .select("id,user_id,slug,title,description,created_at")
    .single();
  if (error) {
    console.error("Could not create a Proof trail.", error);
    return NextResponse.json({ error: "Your trail could not be created." }, { status: 500 });
  }
  return NextResponse.json({ trail }, { status: 201 });
}

export async function DELETE(request: Request) {
  const context = await getContext();
  if ("error" in context) return context.error;
  const { admin, user } = context;

  const trailId = new URL(request.url).searchParams.get("id");
  if (!trailId || !/^[0-9a-f-]{36}$/i.test(trailId)) return NextResponse.json({ error: "Choose a trail to delete." }, { status: 400 });
  const { error } = await admin.from("trails").delete().eq("id", trailId).eq("user_id", user.id);
  if (error) {
    console.error("Could not delete a Proof trail.", error);
    return NextResponse.json({ error: "Your trail could not be deleted." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
