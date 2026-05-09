"use client";

import { useMemo, useId } from "react";
import { buildSparkPath, dailyCumulative } from "@/lib/wallet/sparkline";
import type { Transaction } from "@/lib/wallet/types";

const VIEW_W = 240;
const VIEW_H = 56;

export function Sparkline({
  transactions,
  positive,
}: {
  transactions: Transaction[];
  /** Net is positive — colour the curve in success/accent. */
  positive: boolean;
}) {
  const gradId = useId();

  const paths = useMemo(() => {
    const points = dailyCumulative(transactions);
    return buildSparkPath(points, VIEW_W, VIEW_H, 2);
  }, [transactions]);

  if (!paths || transactions.length < 2) {
    // Not enough data — render a subtle baseline so the layout doesn't jump.
    return (
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-12 w-full"
        aria-hidden
      >
        <line
          x1="2"
          y1={VIEW_H / 2}
          x2={VIEW_W - 2}
          y2={VIEW_H / 2}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeDasharray="3 4"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const stroke = positive ? "#22c55e" : "#ef4444";
  const fillTop = positive ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)";

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-12 w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill={`url(#${gradId})`} />
      <path
        d={paths.line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
