"use client";

import { STATUS_LABEL, STATUS_ORDER } from "@/lib/projects/status";
import type { ProjectStatus } from "@/lib/projects/types";

export type StatusFilter = "all" | ProjectStatus;

const ORDER: StatusFilter[] = ["all", ...STATUS_ORDER];

const LABELS: Record<StatusFilter, string> = {
  all: "Tudo",
  ...STATUS_LABEL,
};

export function StatusChips({
  value,
  counts,
  onChange,
}: {
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (next: StatusFilter) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex gap-2">
        {ORDER.map((s) => {
          const c = counts[s] ?? 0;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
                value === s
                  ? "bg-elevated text-white"
                  : "bg-canvas-soft text-ink"
              }`}
            >
              <span>{LABELS[s]}</span>
              {c > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
                    value === s ? "bg-white/20" : "bg-white text-muted"
                  }`}
                >
                  {c}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
