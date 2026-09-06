"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import { formatCents } from "@/lib/wallet/format";

/**
 * Bento tiles at the top of the wallet, in the Go & Grow style the user asked
 * for: chunky rounded cards, flat saturated fills, one huge figure per tile.
 *
 * The palette is deliberately fixed rather than themed. These tiles are solid
 * blocks that carry their own contrast, the same way the bottom nav pill stays
 * dark in both themes — letting them follow the light/dark tokens would wash
 * the whole effect out.
 */
const LIME = "#c6f432";
const BLUE = "#1e7fd0";
const BLUE_SOFT = "#a5cfec";
const INK = "#0e0e10";

function Tile({
  href,
  bg,
  fg,
  className = "",
  children,
}: {
  href: string;
  bg: string;
  fg: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ backgroundColor: bg, color: fg }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-[1.75rem] p-5 transition active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
}

export function WalletTiles({ expenseCents }: { expenseCents: number }) {
  const { campaigns, hydrated } = useCashHunters();

  const active = campaigns.filter(
    (c) => c.steps.length === 0 || !c.steps.every((s) => s.done)
  );
  const pending = active.reduce((s, c) => s + c.targetCents, 0);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* CashHunters — spans the row: it is the tile with real content. */}
      <Tile href="/finance/cashhunters" bg={BLUE} fg="#ffffff" className="col-span-2 min-h-[9.5rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* The mark is blue-on-white, so it sits in a white badge — the same
                way the Go & Grow logo is a rounded badge in the reference. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cashhunters-mark.jpg"
              alt=""
              className="h-11 w-11 shrink-0 rounded-2xl bg-white object-contain p-1"
            />
            <span className="text-xl font-bold tracking-tight">CashHunters</span>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 opacity-70" strokeWidth={2.5} />
        </div>

        <div className="mt-4">
          <div className="text-5xl font-bold leading-none tracking-tight tabular-nums">
            {hydrated ? active.length : "—"}
          </div>
          <div className="mt-1.5 text-sm font-bold">
            {active.length === 1 ? "campanha ativa" : "campanhas ativas"}
          </div>
          {hydrated && pending > 0 && (
            <span className="mt-2 inline-flex rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
              {formatCents(pending)} por resgatar
            </span>
          )}
        </div>
      </Tile>

      {/* Salário — placeholder until the feature exists. */}
      <Tile href="/finance/salario" bg={LIME} fg={INK} className="min-h-[8.5rem]">
        <div className="text-3xl font-bold leading-none tracking-tight">Salário</div>
        <div>
          <span className="inline-flex whitespace-nowrap rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-bold">
            Em desenvolvimento
          </span>
        </div>
      </Tile>

      {/* Despesas — the period total, with the breakdown behind it. */}
      <Tile href="/finance/despesas" bg={BLUE_SOFT} fg={INK} className="min-h-[8.5rem]">
        <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
          {formatCents(expenseCents)}
        </div>
        <div className="text-sm font-bold">Despesas</div>
      </Tile>
    </div>
  );
}
