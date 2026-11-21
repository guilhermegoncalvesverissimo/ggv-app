"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ChevronLeft,
  FolderKanban,
  MessageCircle,
  Newspaper,
  Plane,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { HeartsIcon } from "@/components/icons/HeartsIcon";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon | typeof HeartsIcon;
};

/** Lazer: a small app inside the app, with its own nav. */
const LAZER_TABS: Tab[] = [
  { href: "/restaurantes", label: "Restaurantes", icon: UtensilsCrossed },
  { href: "/viagens", label: "Viagens", icon: Plane },
];

const MAIN_TABS: Tab[] = [
  { href: "/noticias", label: "Notícias", icon: Newspaper },
  { href: "/networking", label: "Networking", icon: Users },
  { href: "/chat", label: "Notas", icon: MessageCircle },
  { href: "/finance", label: "Wallet", icon: Wallet },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: LAZER_TABS[0].href, label: "Lazer", icon: HeartsIcon },
];

const under = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const inLazer = (pathname: string) => LAZER_TABS.some((t) => under(pathname, t.href));

// Where each side was left, so the hearts reopen the last Lazer tab and the
// back button returns to the main tab you came from.
const LAST_MAIN = "ggv:nav:last-main";
const LAST_LAZER = "ggv:nav:last-lazer";

function read(key: string, fallback: string): string {
  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const lazer = inLazer(pathname);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(lazer ? LAST_LAZER : LAST_MAIN, pathname);
    } catch {
      /* private mode */
    }
  }, [pathname, lazer]);

  const goTo = (key: string, fallback: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(read(key, fallback));
  };

  const tabs = lazer ? LAZER_TABS : MAIN_TABS;

  // Light mode gets a short, faint shadow: the dark-theme one reaches ~45px
  // below the pill, into iOS's home-indicator area, where it shows as a grey
  // glow. Masking that area with an opaque strip only cut the glow off in a
  // hard horizontal line, so the shadow itself is kept small instead.
  return (
    <nav
      aria-label={lazer ? "Navegação Lazer" : "Navegação principal"}
      className="pointer-events-none fixed inset-x-0 bottom-[var(--nav-bottom)] z-30 mx-auto flex max-w-[480px] justify-center px-5"
    >
      <div
        // Remount on mode change so the swap plays the enter animation.
        key={lazer ? "lazer" : "main"}
        className="bottom-nav-pill nav-swap pointer-events-auto flex items-center gap-1 rounded-full bg-elevated/95 p-1.5 shadow-[0_6px_16px_-8px_rgba(15,12,41,0.35)] dark:shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] ring-1 ring-white/10 backdrop-blur transition-[transform,opacity] duration-200"
      >
        {lazer && (
          <>
            <Link
              href="/noticias"
              onClick={goTo(LAST_MAIN, "/noticias")}
              aria-label="Voltar ao menu principal"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/65 transition hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </Link>
            <span aria-hidden className="mx-0.5 h-6 w-px bg-white/15" />
          </>
        )}
        {tabs.map(({ href, label, icon: Icon }) => {
          const isLazerEntry = !lazer && Icon === HeartsIcon;
          const active =
            under(pathname, href) || (pathname === "/" && href === "/noticias");
          return (
            <Link
              key={label}
              href={href}
              onClick={isLazerEntry ? goTo(LAST_LAZER, href) : undefined}
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
