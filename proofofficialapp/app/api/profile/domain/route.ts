import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "Pro profile settings are not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to update your custom domain." }, { status: 401 });

  let payload: { customDomain?: unknown };
  try {
    payload = await request.json() as { customDomain?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid custom domain value." }, { status: 400 });
  }

  if (typeof payload.customDomain !== "string") {
    return NextResponse.json({ error: "Send a valid custom domain value." }, { status: 400 });
  }
  const customDomain = payload.customDomain.trim().toLowerCase();
  if (customDomain && !/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(customDomain)) {
    return NextResponse.json({ error: "Enter a domain like ships.example.com." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();
  if (profileError) {
    console.error("Could not check Proof Pro access for domain update.", profileError);
    return NextResponse.json({ error: "Pro access could not be checked." }, { status: 500 });
  }
  if (!profile.is_pro) return NextResponse.json({ error: "A Proof Pro subscription is required for custom domains." }, { status: 403 });

  const { error } = await admin.from("profiles").update({ custom_domain: customDomain || null }).eq("id", user.id);
  if (error) {
    console.error("Could not save the Proof custom domain.", error);
    return NextResponse.json({ error: "The custom domain could not be saved." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
