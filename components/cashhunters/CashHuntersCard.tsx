"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import { formatCents } from "@/lib/wallet/format";

export function CashHuntersCard() {
  const { campaigns, hydrated } = useCashHunters();

  // Mirror BudgetsCard summary style: title + chevron + a one-line summary.
  const active = campaigns.filter(
    (c) => c.steps.length === 0 || !c.steps.every((s) => s.done)
  );
  const earned = campaigns
    .filter((c) => c.steps.length > 0 && c.steps.every((s) => s.done))
    .reduce((s, c) => s + c.targetCents, 0);
  const pending = active.reduce((s, c) => s + c.targetCents, 0);

  return (
    <Link
      href="/finance/cashhunters"
      className="card block p-5 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-canvas-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cashhunters-logo.png"
            alt=""
            className="h-full w-full object-contain"
          />
        </div>
        <h2 className="flex-1 text-sm font-semibold tracking-tight">
          CashHunters
        </h2>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </div>

      {hydrated && campaigns.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          Acompanha cashback e promoções
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {active.length === 0
            ? "Nenhuma campanha ativa"
            : `${active.length} ${active.length === 1 ? "ativa" : "ativas"}`}
          {pending > 0 ? ` · ${formatCents(pending)} a caminho` : ""}
          {earned > 0 ? ` · ${formatCents(earned)} ganhos` : ""}
        </p>
      )}
    </Link>
  );
}
