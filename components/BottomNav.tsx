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

  // Light mode gets a short, faint shadow: the dark-theme one reaches ~45px
  // below the pill, into iOS's home-indicator area, where it shows as a grey
  // glow. Masking that area with an opaque strip only cut the glow off in a
  // hard horizontal line, so the shadow itself is kept small instead.
  return (
    <nav
      aria-label="Navegação principal"
      className="pointer-events-none fixed inset-x-0 bottom-[var(--nav-bottom)] z-30 mx-auto flex max-w-[480px] justify-center px-5"
    >
      <div className="bottom-nav-pill pointer-events-auto flex items-center gap-1 rounded-full bg-elevated/95 p-1.5 shadow-[0_6px_16px_-8px_rgba(15,12,41,0.35)] dark:shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] ring-1 ring-white/10 backdrop-blur transition-[transform,opacity] duration-200">
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
  );
}
