"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Command, Flame, House, Plus, Search, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const actions = [
  { label: "Go to dashboard", detail: "Your daily shipping log", href: "/", icon: House },
  { label: "What is Proof?", detail: "A calmer way to build in public", href: "/welcome", icon: Sparkles },
  { label: "Log a ship", detail: "Write down what you shipped", action: "log", icon: Plus },
  { label: "View public profile", detail: "See your work in public", href: "/profile", icon: Flame },
  { label: "Plans and Pro", detail: "Manage your plan in settings", href: "/settings#plan", icon: Sparkles },
  { label: "Open settings", detail: "Profile and preferences", href: "/settings", icon: Settings2 },
  { label: "Keyboard shortcuts", detail: "See available keyboard commands", action: "help", icon: Command },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  const filteredActions = useMemo(
    () => actions.filter((action) => `${action.label} ${action.detail}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setShowHelp(false);
      }
    };
    const trigger = document.querySelector("[data-command-trigger]");
    trigger?.addEventListener("click", openMenu);
    window.addEventListener("proof:open-command", openMenu);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      trigger?.removeEventListener("click", openMenu);
      window.removeEventListener("proof:open-command", openMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function choose(action: (typeof actions)[number]) {
    setOpen(false);
    setQuery("");
    if ("href" in action && action.href) router.push(action.href);
    if ("action" in action && action.action === "log") {
      router.push("/");
      window.setTimeout(() => window.dispatchEvent(new Event("proof:quick-log")), 250);
    }
    if ("action" in action && action.action === "help") setShowHelp(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/65 px-4 pt-[18vh] backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-[520px] overflow-hidden rounded-card border border-white/[0.1] bg-[#111113] shadow-2xl shadow-black/50"
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            role="dialog"
            aria-label="Command menu"
            aria-modal="true"
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="flex h-14 items-center gap-3 border-b border-white/[0.08] px-4">
              <Search className="shrink-0 text-muted" size={17} />
              <input
                autoFocus
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted focus:ring-0"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setSelectedIndex((index) => Math.min(index + 1, filteredActions.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setSelectedIndex((index) => Math.max(index - 1, 0));
                  }
                  if (event.key === "Enter" && filteredActions[selectedIndex]) {
                    event.preventDefault();
                    choose(filteredActions[selectedIndex]);
                  }
                }}
                placeholder="What would you like to do?"
                value={query}
              />
              <kbd className="rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[10px] text-muted">ESC</kbd>
            </div>
            <div className="p-2">
              <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Quick actions</p>
              {filteredActions.length ? filteredActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    aria-current={selectedIndex === index ? "true" : undefined}
                    className={`flex min-h-[52px] w-full items-center gap-3 rounded-control px-3 text-left transition-colors hover:bg-white/[0.055] focus-visible:bg-white/[0.055] ${selectedIndex === index ? "bg-white/[0.055]" : ""}`}
                    key={action.label}
                    onClick={() => choose(action)}
                    type="button"
                  >
                    <span className="grid size-8 place-items-center rounded-[8px] border border-white/[0.08] bg-elevated text-muted"><Icon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-foreground">{action.label}</span>
                      <span className="block text-xs text-muted">{action.detail}</span>
                    </span>
                    {"href" in action && <ArrowUpRight className="text-muted" size={14} />}
                    {"action" in action && <Command className="text-muted" size={14} />}
                  </button>
                );
              }) : <p className="px-3 py-5 text-center text-sm text-muted">No matching actions.</p>}
            </div>
            <div className="flex justify-between border-t border-white/[0.08] px-4 py-2.5 text-[10px] text-muted">
              <span>Proof command menu</span><span>↑↓ to navigate · Enter to select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
      {showHelp && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/65 px-4 pt-[20vh] backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHelp(false); }}
        >
          <section aria-labelledby="keyboard-help-title" aria-modal="true" className="w-full max-w-[440px] rounded-card border border-white/[0.1] bg-[#111113] p-5 shadow-2xl shadow-black/50" role="dialog">
            <h2 className="text-sm font-medium" id="keyboard-help-title">Keyboard shortcuts</h2>
            <ul className="mt-4 space-y-3 text-xs text-muted">
              <li className="flex justify-between gap-4"><span>Open or close quick actions</span><kbd>Ctrl/⌘K</kbd></li>
              <li className="flex justify-between gap-4"><span>Save today’s ship</span><kbd>Ctrl/⌘Enter</kbd></li>
              <li className="flex justify-between gap-4"><span>Navigate command results</span><kbd>↑ / ↓, then Enter</kbd></li>
              <li className="flex justify-between gap-4"><span>Close menus</span><kbd>Escape</kbd></li>
            </ul>
            <button autoFocus className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-white/[0.1] text-xs hover:bg-white/[0.04]" onClick={() => setShowHelp(false)} type="button">Close</button>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
