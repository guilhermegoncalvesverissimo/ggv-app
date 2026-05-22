"use client";

import { ChevronDown } from "lucide-react";
import { shortHost } from "@/lib/cashhunters/favicon";
import type { Campaign } from "@/lib/cashhunters/types";
import { CampaignAvatar } from "./CampaignAvatar";

export function CampaignRow({
  campaign,
  onOpen,
}: {
  campaign: Campaign;
  onOpen: () => void;
}) {
  const done = campaign.steps.filter((s) => s.done).length;
  const total = campaign.steps.length;
  const completed = total > 0 && done === total;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]"
    >
      <CampaignAvatar name={campaign.name} url={campaign.url} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            {campaign.name}
          </h3>
          {completed && (
            <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
              ✓
            </span>
          )}
        </div>
        <p className="truncate text-xs text-accent">
          {shortHost(campaign.url) || "—"}
        </p>
        {total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-soft">
              <div
                className={`h-full rounded-full transition-all ${
                  completed ? "bg-success" : "bg-ink/70"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-medium text-muted tabular-nums">
              {done}/{total}
            </span>
          </div>
        )}
      </div>

      <ChevronDown className="h-5 w-5 shrink-0 -rotate-90 text-muted" />
    </button>
  );
}
