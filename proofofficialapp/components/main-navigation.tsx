"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, House, Settings2, Sparkles, UserRound } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: <House size={14} /> },
  { href: "/profile", label: "Profile", icon: <UserRound size={14} /> },
  { href: "/welcome", label: "About", icon: <Sparkles size={14} /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
  { href: "/settings", label: "Settings", icon: <Settings2 size={14} /> },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="order-3 -mx-1 flex w-[calc(100%+0.5rem)] items-center justify-center gap-1 overflow-x-auto border-t border-white/[0.06] py-1 sm:absolute sm:left-1/2 sm:top-1/2 sm:order-none sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border-0 sm:py-0" aria-label="Main navigation">
      {links.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-2.5 text-[11px] transition-colors sm:px-3 sm:text-[12px] ${active ? "bg-white/[0.06] text-foreground" : "text-muted hover:bg-white/[0.04] hover:text-foreground"}`}
            href={href}
            key={href}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function HeaderAction({ signedIn }: { signedIn: boolean }) {
  const className = "inline-flex min-h-10 items-center gap-2 rounded-control border border-white/[0.1] px-3.5 text-[12px] font-medium transition-colors hover:border-white/[0.16]";

  if (signedIn) {
    return (
      <Link aria-label="Your account settings" className={`${className} border-indigo-300/20 bg-indigo-400/[0.08] text-foreground hover:bg-indigo-400/[0.13]`} href="/settings">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-300" />
        <span>Account</span>
      </Link>
    );
  }

  return (
    <Link className={`${className} text-muted hover:text-foreground`} href="/login">
      <span>Sign in</span>
    </Link>
  );
}
