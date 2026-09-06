"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  MessageCircle,
  Newspaper,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/noticias", label: "Notícias", icon: Newspaper },
  { href: "/networking", label: "Networking", icon: Users },
  { href: "/chat", label: "Notas", icon: MessageCircle },
  { href: "/finance", label: "Wallet", icon: Wallet },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Home-indicator strip.
          The pill's drop shadow reaches 18px down with a 40px blur — tuned for
          the dark theme, where it's invisible. In light mode it lands inside
          iOS's home-indicator area, which nothing else paints, and reads as a
          grey band across the bottom of the screen. This masks it (and any
          content that scrolls under the pill) with the page colour. Sits above
          the nav's z-30 so it covers the shadow, but only spans the inset, so
          it never touches the pill itself. Collapses to zero height where
          there is no inset. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[35] h-[env(safe-area-inset-bottom)] bg-canvas"
      />
      <nav
        aria-label="Navegação principal"
        className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-30 mx-auto flex max-w-[480px] justify-center px-5"
      >
      <div className="bottom-nav-pill pointer-events-auto flex items-center gap-1 rounded-full bg-elevated/95 p-1.5 shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] ring-1 ring-white/10 backdrop-blur transition-[transform,opacity] duration-200">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (pathname === "/" && href === "/noticias");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full transition",
                // The active pill is always white in both themes, so its icon
                // must always be dark — `text-ink` would invert to white in
                // dark mode and vanish.
                active
                  ? "bg-white text-[#0e0e10]"
                  : "text-white/65 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </Link>
          );
        })}
        </div>
      </nav>
    </>
  );
}
