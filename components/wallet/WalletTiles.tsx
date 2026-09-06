"use client";

import Link from "next/link";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import { formatCents } from "@/lib/wallet/format";
import { periodLabel, type Period } from "@/lib/wallet/period";

/**
 * Bento carousel at the top of the wallet, laid out like the Go & Grow print:
 *
 *   row 1 ─ wide title card + narrow stat cards   (widths in the 2.15 : 1 ratio
 *   row 2 ─ equal stat cards                       measured off the reference)
 *
 * Both rows live in one horizontal rail, so they pan together and cards spill
 * past the screen edges the way they do in the reference. The rail is
 * full-bleed (see `.tile-rail` in globals.css): the first card sits inset and
 * the next one peeks, which is also the affordance that says "scroll me".
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

const H = "h-[8.75rem]"; // ≈138pt, the card height in the reference
const W_WIDE = "w-[13rem]";
const W_NARROW = "w-[6.5rem]";
const W_HALF = "w-[9.5rem]";

function Tile({
  href,
  bg,
  fg,
  width,
  className = "",
  children,
}: {
  href?: string;
  bg: string;
  fg: string;
  width: string;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = `flex shrink-0 flex-col overflow-hidden rounded-[1.75rem] p-4 ${H} ${width} ${className}`;
  const style = { backgroundColor: bg, color: fg };

  // Not every tile navigates — the stat-only ones render as plain blocks.
  if (!href) {
    return (
      <div style={style} className={cls}>
        {children}
      </div>
    );
  }
  return (
    <Link href={href} style={style} className={`${cls} transition active:scale-[0.98]`}>
      {children}
    </Link>
  );
}

export function WalletTiles({
  expenseCents,
  incomeCents,
  budgetCount,
  txCount,
  period,
}: {
  expenseCents: number;
  incomeCents: number;
  budgetCount: number;
  txCount: number;
  period: Period;
}) {
  const { campaigns, hydrated } = useCashHunters();

  const active = campaigns.filter(
    (c) => c.steps.length === 0 || !c.steps.every((s) => s.done)
  );

  return (
    <div className="tile-rail -mx-5">
      <div className="flex w-max flex-col gap-3 px-5">
        {/* Row 1 */}
        <div className="flex gap-3">
          {/* Title card — the slot the reference uses for the headline. */}
          <div
            style={{ backgroundColor: LIME, color: INK }}
            className={`flex shrink-0 flex-col justify-center rounded-[1.75rem] p-5 ${H} ${W_WIDE}`}
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
            width={W_NARROW}
            className="items-center justify-center text-center"
          >
            {/* The mark is blue-on-white, so it sits in a white badge — the
                same treatment the logo gets in the reference. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cashhunters-mark.jpg"
              alt=""
              className="h-7 w-7 rounded-lg bg-white object-contain p-0.5"
            />
            <div className="mt-1 text-3xl font-bold leading-none tracking-tight tabular-nums">
              {hydrated ? active.length : "—"}
            </div>
            <div className="mt-1 text-[10px] font-bold leading-tight">
              CashHunters
            </div>
          </Tile>

          <Tile
            href="/finance/budgets"
            bg={LIME_SOFT}
            fg={INK}
            width={W_HALF}
            className="justify-between"
          >
            <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
              {budgetCount}
            </div>
            <div className="text-sm font-bold">Orçamentos</div>
          </Tile>

          {/* Onde vive a lista, o saldo e o botão de adicionar. */}
          <Tile
            href="/finance/transacoes"
            bg={BLUE_SOFT}
            fg={INK}
            width={W_HALF}
            className="justify-between"
          >
            <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
              {txCount}
            </div>
            <div className="text-sm font-bold">Transações</div>
          </Tile>
        </div>

        {/* Row 2 */}
        <div className="flex gap-3">
          <Tile
            href="/finance/salario"
            bg={LIME_SOFT}
            fg={INK}
            width={W_HALF}
            className="justify-between"
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
            width={W_HALF}
            className="justify-between"
          >
            <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
              {formatCents(expenseCents)}
            </div>
            <div className="text-sm font-bold">Despesas</div>
          </Tile>

          {/* Stat only — the wallet already lists the transactions below. */}
          <Tile bg={BLUE} fg="#ffffff" width={W_HALF} className="justify-between">
            <div className="text-3xl font-bold leading-none tracking-tight tabular-nums">
              {formatCents(incomeCents)}
            </div>
            <div className="text-sm font-bold">Entradas</div>
          </Tile>
        </div>
      </div>
    </div>
  );
}
