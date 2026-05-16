"use client";

import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents } from "@/lib/wallet/format";
import type { Transaction, TxType } from "@/lib/wallet/types";

/** Distinct, non-purple palette for the donut segments + category bubbles. */
const SLICE_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#ec4899", // pink
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#22c55e", // green
  "#14b8a6", // teal
  "#84cc16", // lime
  "#0ea5e9", // sky
];

const MAX_ROWS = 6;

type Slice = {
  category: string;
  label: string;
  emoji: string;
  cents: number;
  pct: number;
  color: string;
};

export function CategoriesOverview({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [mode, setMode] = useState<TxType>("expense");
  const [unit, setUnit] = useState<"pct" | "eur">("pct");

  const { slices, total } = useMemo(() => {
    const sums = new Map<string, number>();
    let totalCents = 0;
    for (const t of transactions) {
      if (t.type !== mode) continue;
      sums.set(t.category, (sums.get(t.category) ?? 0) + t.amountCents);
      totalCents += t.amountCents;
    }
    const ordered = [...sums.entries()].sort((a, b) => b[1] - a[1]);
    const built: Slice[] = ordered.map(([category, cents], i) => {
      const cat = categoryById(category);
      return {
        category,
        label: cat?.label ?? "Outras",
        emoji: cat?.emoji ?? "❓",
        cents,
        pct: totalCents > 0 ? (cents / totalCents) * 100 : 0,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      };
    });
    return { slices: built, total: totalCents };
  }, [transactions, mode]);

  // Build cumulative offsets for the donut (r chosen so circumference ≈ 100).
  let acc = 0;
  const arcs = slices.map((s) => {
    const arc = { ...s, offset: acc };
    acc += s.pct;
    return arc;
  });

  const rows = slices.slice(0, MAX_ROWS);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">
          Resumo por categoria
        </h2>
        <div className="flex rounded-full bg-canvas-soft p-0.5">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMode(t)}
              aria-pressed={mode === t}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                mode === t
                  ? t === "expense"
                    ? "bg-danger text-white"
                    : "bg-success text-white"
                  : "text-muted"
              }`}
            >
              {t === "expense" ? "Saídas" : "Entradas"}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-soft">
            <PieChart className="h-5 w-5 text-muted" />
          </div>
          <p className="text-sm text-muted">
            Sem {mode === "expense" ? "saídas" : "entradas"} neste período.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          {/* Donut */}
          <svg viewBox="0 0 36 36" className="h-28 w-28 shrink-0">
            <g transform="rotate(-90 18 18)">
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="currentColor"
                className="text-canvas-soft"
                strokeWidth="4"
              />
              {arcs.map((a) => (
                <circle
                  key={a.category}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={a.color}
                  strokeWidth="4"
                  strokeDasharray={`${a.pct} ${100 - a.pct}`}
                  strokeDashoffset={`${-a.offset}`}
                  strokeLinecap="butt"
                />
              ))}
            </g>
            <text
              x="18"
              y="17.5"
              textAnchor="middle"
              className="fill-ink"
              style={{ fontSize: 4, fontWeight: 600 }}
            >
              {slices.length}
            </text>
            <text
              x="18"
              y="22"
              textAnchor="middle"
              className="fill-muted"
              style={{ fontSize: 2.4 }}
            >
              {slices.length === 1 ? "categoria" : "categorias"}
            </text>
          </svg>

          {/* Legend */}
          <ul className="min-w-0 flex-1 space-y-2.5">
            {rows.map((s) => (
              <li key={s.category} className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ background: s.color }}
                >
                  {s.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {s.label}
                </span>
                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: s.color }}
                >
                  {unit === "pct"
                    ? `${s.pct.toFixed(1)}%`
                    : formatCents(s.cents)}
                </span>
              </li>
            ))}
            {slices.length > MAX_ROWS && (
              <li className="pl-9 text-xs text-muted">
                +{slices.length - MAX_ROWS} outras
              </li>
            )}
          </ul>
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex justify-start">
          <div className="flex rounded-full bg-canvas-soft p-0.5">
            {(["pct", "eur"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  unit === u ? "bg-elevated text-on-elevated" : "text-muted"
                }`}
              >
                {u === "pct" ? "%" : "€"}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
