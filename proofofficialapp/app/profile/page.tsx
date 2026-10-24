import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ProfileTabPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/alex-morgan");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/alex-morgan");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Could not load the signed-in Proof profile.", error);
    throw new Error("Could not load your public profile.");
  }

  redirect(`/${profile.username}`);
}
