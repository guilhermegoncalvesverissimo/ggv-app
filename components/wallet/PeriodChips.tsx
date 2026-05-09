"use client";

import { type Period, PERIOD_LABELS } from "@/lib/wallet/period";

const ORDER: Period[] = ["thisMonth", "lastMonth", "year", "all"];

export function PeriodChips({
  value,
  onChange,
}: {
  value: Period;
  onChange: (next: Period) => void;
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <div className="flex gap-2">
        {ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
              value === p
                ? "bg-ink text-white"
                : "bg-white/55 text-ink backdrop-blur-sm"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  );
}
