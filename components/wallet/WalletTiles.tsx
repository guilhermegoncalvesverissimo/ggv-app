"use client";

import Link from "next/link";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import { formatCents } from "@/lib/wallet/format";
import { periodLabel, type Period } from "@/lib/wallet/period";

/**
 * Bento tiles at the top of the wallet, laid out like the Go & Grow reference:
 *
 *   row 1 ─ wide title card + narrow stat card   (2.15 : 1, measured off the print)
 *   row 2 ─ two equal stat cards
 *
 * Both rows share one height, so the block reads as a single slab.
 *
 * The palette is deliberately fixed rather than themed. These are solid blocks
 * that carry their own contrast, the same way the bottom nav pill stays dark in
 * both themes — letting them follow the light/dark tokens would wash the whole
 * effect out.
 */
const LIME = "#c6f432";
const LIME_SOFT = "#dcf7a0";
const BLUE = "#1e7fd0";
const BLUE_SOFT = "#a5cfec";
const INK = "#0e0e10";

const H = "min-h-[8.75rem]"; // ≈138pt, the card height in the reference

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
      className={`flex flex-col overflow-hidden rounded-[1.75rem] p-4 transition active:scale-[0.98] ${H} ${className}`}
    >
      {children}
    </Link>
  );
}

export function WalletTiles({
  expenseCents,
  period,
}: {
  expenseCents: number;
  period: Period;
}) {
  const { campaigns, hydrated } = useCashHunters();

  const active = campaigns.filter(
    (c) => c.steps.length === 0 || !c.steps.every((s) => s.done)
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1 — wide title card + narrow stat card */}
      <div className="flex gap-3">
        {/* Title card, the slot the reference uses for the headline. */}
        <div
          style={{ backgroundColor: LIME, color: INK }}
          className={`flex flex-[2.15] flex-col justify-center rounded-[1.75rem] p-5 ${H}`}
        >
          <div className="text-[1.75rem] font-bold leading-[1.05] tracking-tight">
            A minha
            <br />
            Wallet
          </div>
          <div className="mt-2 text-sm font-bold opacity-70">
            {periodLabel(period)}
          </div>
        </div>

        {/* CashHunters — centred, like the "9" card in the reference. */}
        <Tile
          href="/finance/cashhunters"
          bg={BLUE}
          fg="#ffffff"
          className="flex-1 items-center justify-center text-center"
        >
          {/* The mark is blue-on-white, so it sits in a white badge — the same
              treatment the logo gets in the reference. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cashhunters-mark.jpg"
            alt=""
            className="h-8 w-8 rounded-xl bg-white object-contain p-0.5"
          />
          <div className="mt-1 text-4xl font-bold leading-none tracking-tight tabular-nums">
            {hydrated ? active.length : "—"}
          </div>
          <div className="mt-1 text-[11px] font-bold leading-tight">
            CashHunters
          </div>
        </Tile>
      </div>

      {/* Row 2 — two equal cards */}
      <div className="flex gap-3">
        <Tile
          href="/finance/salario"
          bg={LIME_SOFT}
          fg={INK}
          className="flex-1 justify-between"
        >
          <div className="text-3xl font-bold leading-none tracking-tight">
            Salário
          </div>
          <div>
            <span className="inline-flex whitespace-nowrap rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-bold">
              Em desenvolvimento
            </span>
          </div>
        </Tile>

        <Tile
          href="/finance/despesas"
          bg={BLUE_SOFT}
          fg={INK}
          className="flex-1 justify-between"
        >
          <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
            {formatCents(expenseCents)}
          </div>
          <div className="text-sm font-bold">Despesas</div>
        </Tile>
      </div>
    </div>
  );
}
