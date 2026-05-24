"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useCashHunters } from "@/lib/cashhunters/useCashHunters";
import type { Campaign, Kind } from "@/lib/cashhunters/types";
import { CampaignRow } from "./CampaignRow";
import { CampaignSheet } from "./CampaignSheet";

const SECTION_TITLE: Record<Kind, string> = {
  card: "Cartões",
  campaign: "Campanhas",
};
const EMPTY_TEXT: Record<Kind, string> = {
  card: "Sem cartões. Adiciona um cartão de crédito e define o esquema (top-up, transferência, pagamento…) que repetes para ganhar pontos / cashback.",
  campaign: "Sem campanhas. Adiciona uma campanha de cashback ou promoção e define o valor a ganhar + os passos.",
};
const NEW_BUTTON: Record<Kind, string> = {
  card: "Novo cartão",
  campaign: "Nova campanha",
};

function sortByActiveFirst(list: Campaign[]) {
  return [...list].sort((a, b) => {
    const aDone = a.steps.length > 0 && a.steps.every((s) => s.done);
    const bDone = b.steps.length > 0 && b.steps.every((s) => s.done);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return b.updatedAt - a.updatedAt;
  });
}

export function CashHuntersBoard() {
  const {
    cards,
    campaigns,
    hydrated,
    addCampaign,
    addCard,
    updateCampaign,
    removeCampaign,
  } = useCashHunters();

  // One global "currently-editing" — the sheet figures out the kind from
  // editing.kind, which is set on the row when it was created.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingKind, setAddingKind] = useState<Kind | null>(null);

  const editing = useMemo<Campaign | null>(
    () =>
      [...cards, ...campaigns].find((c) => c.id === editingId) ?? null,
    [cards, campaigns, editingId]
  );

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  const renderSection = (kind: Kind, items: Campaign[]) => {
    const ordered = sortByActiveFirst(items);
    return (
      <section className="space-y-3">
        <header className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {SECTION_TITLE[kind]}
          </h2>
          <button
            type="button"
            aria-label={NEW_BUTTON[kind]}
            onClick={() => setAddingKind(kind)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-on-elevated transition active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        {ordered.length === 0 ? (
          <div className="card p-6 text-center text-sm text-muted">
            {EMPTY_TEXT[kind]}
          </div>
        ) : (
          <div className="space-y-3">
            {ordered.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                onOpen={() => setEditingId(c.id)}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {renderSection("card", cards)}
        {renderSection("campaign", campaigns)}
      </div>

      {/* Create sheet — kind chosen by which section's + you tapped. */}
      <CampaignSheet
        open={addingKind !== null}
        onClose={() => setAddingKind(null)}
        editing={null}
        kind={addingKind ?? "campaign"}
        onCreate={addingKind === "card" ? addCard : addCampaign}
        onUpdate={updateCampaign}
        onDelete={removeCampaign}
      />

      {/* Edit sheet — kind comes from the row being edited. */}
      <CampaignSheet
        open={!!editing}
        onClose={() => setEditingId(null)}
        editing={editing}
        kind={editing?.kind ?? "campaign"}
        onCreate={addCampaign}
        onUpdate={updateCampaign}
        onDelete={removeCampaign}
      />
    </>
  );
}
