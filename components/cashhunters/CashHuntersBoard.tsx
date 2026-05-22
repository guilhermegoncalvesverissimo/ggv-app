"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import type { Campaign } from "@/lib/cashhunters/types";
import { CampaignRow } from "./CampaignRow";
import { CampaignSheet } from "./CampaignSheet";

export function CashHuntersBoard() {
  const {
    campaigns,
    hydrated,
    addCampaign,
    updateCampaign,
    removeCampaign,
  } = useCashHunters();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = useMemo<Campaign | null>(
    () => campaigns.find((c) => c.id === editingId) ?? null,
    [campaigns, editingId]
  );

  // Active campaigns first, then completed.
  const ordered = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aDone = a.steps.length > 0 && a.steps.every((s) => s.done);
      const bDone = b.steps.length > 0 && b.steps.every((s) => s.done);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return b.updatedAt - a.updatedAt;
    });
  }, [campaigns]);

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <>
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas-soft">
            <Sparkles className="h-6 w-6 text-ink" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Ainda sem campanhas
          </h2>
          <p className="max-w-xs text-sm text-muted">
            Adiciona uma campanha de cashback ou promoção que estás a fazer.
            Define o valor a ganhar e os passos necessários.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-2 rounded-full bg-elevated px-5 py-2.5 text-sm font-medium text-on-elevated transition active:scale-95"
          >
            Nova campanha
          </button>
        </div>

        <CampaignSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          editing={null}
          onCreate={addCampaign}
          onUpdate={updateCampaign}
          onDelete={removeCampaign}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {ordered.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            onOpen={() => setEditingId(c.id)}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Nova campanha"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-on-elevated shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <CampaignSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        editing={null}
        onCreate={addCampaign}
        onUpdate={updateCampaign}
        onDelete={removeCampaign}
      />
      <CampaignSheet
        open={!!editing}
        onClose={() => setEditingId(null)}
        editing={editing}
        onCreate={addCampaign}
        onUpdate={updateCampaign}
        onDelete={removeCampaign}
      />
    </>
  );
}
