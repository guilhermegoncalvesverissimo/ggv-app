"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import { formatCents } from "@/lib/wallet/format";
import { CampaignAvatar } from "./CampaignAvatar";

export function CashHuntersCard() {
  const { campaigns, hydrated } = useCashHunters();

  const active = campaigns.filter(
    (c) => c.steps.length === 0 || !c.steps.every((s) => s.done)
  );
  const earned = campaigns
    .filter((c) => c.steps.length > 0 && c.steps.every((s) => s.done))
    .reduce((s, c) => s + c.targetCents, 0);
  const pending = active.reduce((s, c) => s + c.targetCents, 0);

  // Rows sorted: closer-to-completion first, completed last.
  const rows = [...campaigns]
    .map((c) => {
      const done = c.steps.filter((s) => s.done).length;
      const total = c.steps.length;
      const complete = total > 0 && done === total;
      const pct = total > 0 ? (done / total) * 100 : 0;
      return { campaign: c, done, total, complete, pct };
    })
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      return b.pct - a.pct;
    });

  return (
    <Link
      href="/finance/cashhunters"
      className="card block p-5 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cashhunters-logo.png"
          alt=""
          className="h-10 w-10 shrink-0 object-contain"
        />
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
        <>
          <p className="mt-3 text-xs text-muted">
            {active.length === 0
              ? "Nenhuma campanha ativa"
              : `${active.length} ${active.length === 1 ? "ativa" : "ativas"}`}
            {pending > 0 ? ` · ${formatCents(pending)} a caminho` : ""}
            {earned > 0 ? ` · ${formatCents(earned)} ganhos` : ""}
          </p>

          {rows.length > 0 && (
            <ul className="mt-4 space-y-3 border-t border-canvas-soft/60 pt-4">
              {rows.map(({ campaign, done, total, complete, pct }) => (
                <li key={campaign.id}>
                  <div className="flex items-center gap-2.5">
                    <CampaignAvatar
                      name={campaign.name}
                      url={campaign.url}
                      size="h-6 w-6"
                      rounded="rounded-lg"
                      textSize="text-[10px]"
                      iconSize={48}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {campaign.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      {total === 0 ? "sem passos" : `${done} / ${total} passos`}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                      <div
                        className={`h-full rounded-full transition-all ${
                          complete ? "bg-success" : "bg-warn"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Link>
  );
}
