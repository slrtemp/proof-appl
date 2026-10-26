"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowUpRight, Camera, Check, ExternalLink, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { PortalButton } from "@/components/billing-button";
import { AccountActions } from "@/components/account-actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SettingsValues = {
  id: string | null;
  username: string;
  fullName: string;
  tagline: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string | null;
  email: string;
  isPro: boolean;
  isPublic?: boolean;
  billingNotice?: string | null;
  hasBilling?: boolean;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initial.avatarUrl);

  useEffect(() => {
    if (!avatarPreview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    if (initial.id) return;
    try {
      const stored = window.localStorage.getItem("proof-demo-profile-v1");
      if (!stored) return;
      const profile = JSON.parse(stored) as { username?: unknown; fullName?: unknown; tagline?: unknown; bio?: unknown; location?: unknown; website?: unknown; isPublic?: unknown };
      setValues((current) => ({
        ...current,
        username: typeof profile.username === "string" ? profile.username : current.username,
        fullName: typeof profile.fullName === "string" ? profile.fullName : current.fullName,
        tagline: typeof profile.tagline === "string" ? profile.tagline : current.tagline,
        bio: typeof profile.bio === "string" ? profile.bio : current.bio,
        location: typeof profile.location === "string" ? profile.location : current.location,
        website: typeof profile.website === "string" ? profile.website : current.website,
        isPublic: typeof profile.isPublic === "boolean" ? profile.isPublic : current.isPublic,
      }));
    } catch (loadError) {
      console.error("Could not load Proof demo settings.", loadError);
      setError("Saved demo settings could not be loaded.");
    }
  }, [initial.id]);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  function update(field: keyof SettingsValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setStatus("");
    setError("");
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Keep your profile photo under 5 MB.");
      event.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setStatus("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = values.username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,31}$/.test(username)) {
      setError("Use 2–32 letters, numbers, hyphens, or underscores. Start with a letter or number.");
      return;
    }
    if (values.fullName.trim().length < 2) {
      setError("Add a name at least two characters long.");
      return;
    }
    if (values.bio.length > 160) {
      setError("Keep your bio under 160 characters.");
      return;
    }
    if (values.tagline.length > 100 || values.location.length > 60) {
      setError("Keep your one-liner under 100 characters and location under 60.");
      return;
    }
    let website: string | null = null;
    if (values.website.trim()) {
      try {
        const parsedWebsite = new URL(values.website.match(/^https?:\/\//i) ? values.website.trim() : `https://${values.website.trim()}`);
        if (!["http:", "https:"].includes(parsedWebsite.protocol)) throw new Error("Unsupported website protocol.");
        website = parsedWebsite.toString();
      } catch {
        setError("Enter a valid website, like example.com.");
        return;
      }
    }
    setBusy(true);
    const supabase = createClient();
    try {
      let avatarUrl = values.avatarUrl;
      if (supabase && values.id) {
        if (avatarFile) {
          const { error: uploadError } = await supabase.storage.from("avatars").upload(`${values.id}/avatar`, avatarFile, {
            cacheControl: "3600",
            contentType: avatarFile.type,
            upsert: true,
          });
          if (uploadError) throw new Error(`Profile photo could not be uploaded: ${uploadError.message}`);
          avatarUrl = `${supabase.storage.from("avatars").getPublicUrl(`${values.id}/avatar`).data.publicUrl}?v=${Date.now()}`;
        }

        const { error: saveError } = await supabase.from("profiles").update({
          username,
          full_name: values.fullName.trim(),
          tagline: values.tagline.trim(),
          bio: values.bio.trim(),
          location: values.location.trim(),
          website,
          avatar_url: avatarUrl,
          is_public: values.isPublic ?? true,
        }).eq("id", values.id);
        if (saveError) throw new Error(saveError.code === "23505" ? "That username is already taken." : saveError.message);
        setAvatarFile(null);
      } else {
        window.localStorage.setItem("proof-demo-profile-v1", JSON.stringify({
          username,
          fullName: values.fullName.trim(),
          tagline: values.tagline.trim(),
          bio: values.bio.trim(),
          location: values.location.trim(),
          website,
          isPublic: values.isPublic ?? true,
        }));
      }
      setValues((current) => ({
        ...current,
        username,
        fullName: current.fullName.trim(),
        tagline: current.tagline.trim(),
        bio: current.bio.trim(),
        location: current.location.trim(),
        website: website ?? "",
        avatarUrl,
      }));
      setAvatarPreview(avatarUrl);
      setStatus("Profile saved.");
      router.refresh();
    } catch (saveError) {
      console.error("Could not save the Proof profile.", saveError);
      setError(saveError instanceof Error ? saveError.message : "Your profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6" onSubmit={save}>
        <div className="mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Public profile</p>
          <h2 className="mt-1 text-lg font-medium tracking-[-0.04em]">Make it yours.</h2>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-control border border-white/[0.08] bg-background p-4 sm:flex-row sm:items-center">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.08] bg-elevated text-muted">
              {avatarPreview
                ? <Image alt="Profile photo preview" className="size-full object-cover" height={64} src={avatarPreview} unoptimized width={64} />
                : <UserRound size={24} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="mt-1 text-xs leading-5 text-muted">{initial.id ? "JPG, PNG, or WebP · up to 5 MB" : "Sign in to add a profile photo."}</p>
              {initial.id && <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control border border-white/[0.1] px-3 text-xs font-medium transition-colors hover:bg-white/[0.04]">
                <Camera size={14} />{avatarFile ? "Choose a different photo" : "Choose photo"}
                <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectAvatar} type="file" />
              </label>}
              {avatarFile && <p className="mt-1 truncate text-[11px] text-muted">{avatarFile.name}</p>}
            </div>
          </div>
          <SettingsField label="Name" maxLength={60} onChange={(value) => update("fullName", value)} value={values.fullName} />
          <SettingsField label="Username" maxLength={32} onChange={(value) => update("username", value.replace(/^@/, ""))} prefix="@" value={values.username} />
          <SettingsField label="One-line intro" maxLength={100} onChange={(value) => update("tagline", value)} placeholder="What are you working toward?" value={values.tagline} />
          <div>
            <label className="mb-2 block text-xs text-muted" htmlFor="bio">About you</label>
            <textarea className="min-h-24 w-full resize-y rounded-control border border-white/[0.08] bg-background px-3 py-2.5 text-sm leading-6 placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" id="bio" maxLength={160} onChange={(event) => update("bio", event.target.value)} placeholder="A little more about the work and ideas you care about." value={values.bio} />
            <p className="mt-1 text-right text-[10px] text-muted">{values.bio.length}/160</p>
          </div>
          <SettingsField label="Location" maxLength={60} onChange={(value) => update("location", value)} placeholder="City, country (optional)" value={values.location} />
          <SettingsField label="Website" maxLength={2048} onChange={(value) => update("website", value)} placeholder="yourwebsite.com" value={values.website} />
          <label className="flex min-h-11 items-center gap-3 rounded-control border border-white/[0.08] bg-background px-3 text-xs text-muted">
            <input checked={values.isPublic ?? true} className="size-4 accent-white focus:ring-accent" onChange={(event) => {
              setValues((current) => ({ ...current, isPublic: event.target.checked }));
              setStatus("");
              setError("");
            }} type="checkbox" />
            Show my public profile and ships to anyone with the link
          </label>
        </div>
        {error && <p className="mt-4 text-xs text-red-300" role="alert">{error}</p>}
        {status && <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-200" role="status"><Check size={13} />{status}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-control border border-white/[0.1] px-4 text-sm text-muted transition-colors hover:text-foreground" href={`/${values.username}`}><ExternalLink size={14} /> Preview profile</Link>
        </div>
      </form>

      <section className="scroll-mt-24 rounded-card border border-white/[0.08] bg-surface p-5 sm:p-6" id="plan">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Plan & account</p>
        <h2 className="mt-1 text-lg font-medium tracking-[-0.04em]">Your account.</h2>
        <p className="mt-4 text-xs text-muted">Signed in as <span className="text-foreground">{values.email || "Demo builder"}</span></p>
        {initial.billingNotice && <p className="mt-3 rounded-control border border-amber-200/10 bg-amber-200/[0.04] p-3 text-xs leading-5 text-muted" role="status">{initial.billingNotice}</p>}
        <div className="mt-5 border-t border-white/[0.08] pt-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{values.isPro ? "Proof Pro" : values.hasBilling ? "Proof Pro · payment needed" : "Proof Free"}</p><p className="mt-1 text-xs text-muted">{values.isPro ? "Your Pro features are active." : values.hasBilling ? "Manage your existing subscription." : "The essentials, always free."}</p></div><span className="rounded-full border border-white/[0.1] px-2.5 py-1 text-[10px] text-muted">{values.isPro ? "ACTIVE" : values.hasBilling ? "ACTION NEEDED" : "FREE"}</span></div>
          {values.hasBilling ? <PortalButton /> : values.isPro ? <p className="text-xs leading-5 text-muted">Pro access is included with your account.</p> : (
            <>
              <p className="mb-3 max-w-xl text-xs leading-5 text-muted">Pro adds 30/90/365-day analytics, builder XP and levels, a monthly canopy report, extra share-card themes, and optional removal of Proof branding.</p>
              <Link className="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-[#7476ff]" href="/pricing">Get Pro <ArrowUpRight size={14} /></Link>
              {!values.id && <p className="mt-2 text-[10px] text-muted">Demo billing requires an account.</p>}
            </>
          )}
          {values.id && <Button className="ml-2" onClick={signOut} type="button" variant="ghost"><LogOut size={14} />Sign out</Button>}
          {values.id && <AccountActions />}
        </div>
      </section>
    </div>
  );
}

function SettingsField({ label, value, onChange, maxLength, placeholder, prefix }: { label: string; value: string; onChange: (value: string) => void; maxLength: number; placeholder?: string; prefix?: string }) {
  const id = `settings-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div>
      <label className="mb-2 block text-xs text-muted" htmlFor={id}>{label}</label>
      <div className="flex min-h-11 items-center rounded-control border border-white/[0.08] bg-background focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        {prefix && <span className="pl-3 text-sm text-muted">{prefix}</span>}
        <input className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm focus:outline-none focus:ring-0" id={id} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      </div>
    </div>
  );
}
