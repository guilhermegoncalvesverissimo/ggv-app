"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type Period,
  currentMonth,
  periodLabel,
  stepPeriod,
} from "@/lib/wallet/period";

const MODES = [
  ["month", "Mês"],
  ["year", "Ano"],
  ["all", "Tudo"],
] as const;

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const now = new Date();
  const canStep = value.kind !== "all";

  const selectMode = (mode: (typeof MODES)[number][0]) => {
    if (mode === "month") {
      onChange(currentMonth(now));
    } else if (mode === "year") {
      const year = "year" in value ? value.year : now.getFullYear();
      onChange({ kind: "year", year });
    } else {
      onChange({ kind: "all" });
    }
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Stepper */}
      <div className="flex items-center gap-0.5 rounded-full bg-canvas-soft p-1">
        <button
          type="button"
          aria-label="Anterior"
          disabled={!canStep}
          onClick={() => onChange(stepPeriod(value, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <span className="min-w-[104px] text-center text-sm font-semibold tracking-tight text-ink">
          {periodLabel(value)}
        </span>
        <button
          type="button"
          aria-label="Seguinte"
          disabled={!canStep}
          onClick={() => onChange(stepPeriod(value, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition active:scale-90 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Mode switch */}
      <div className="flex rounded-full bg-canvas-soft p-0.5">
        {MODES.map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => selectMode(mode)}
            aria-pressed={value.kind === mode}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              value.kind === mode
                ? "bg-elevated text-on-elevated"
                : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
