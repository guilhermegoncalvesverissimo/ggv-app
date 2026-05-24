"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { CampaignAvatar } from "./CampaignAvatar";
import { formatCents, parseAmountToCents } from "@/lib/wallet/format";
import type {
  Campaign,
  CampaignInput,
  Kind,
  Step,
} from "@/lib/cashhunters/types";

type CopyKey = "newTitle" | "editTitle" | "remove" | "removeConfirm" | "urlPlaceholder" | "targetLabel";
const COPY: Record<Kind, Record<CopyKey, string>> = {
  campaign: {
    newTitle: "Nova campanha",
    editTitle: "Editar campanha",
    remove: "Remover",
    removeConfirm: "Apagar campanha",
    urlPlaceholder: "https://postmarkapp.com",
    targetLabel: "Objetivo de ganho",
  },
  card: {
    newTitle: "Novo cartão",
    editTitle: "Editar cartão",
    remove: "Remover",
    removeConfirm: "Apagar cartão",
    urlPlaceholder: "https://bankinter.pt",
    targetLabel: "Valor de referência",
  },
};

function stepId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CampaignSheet({
  open,
  onClose,
  editing,
  kind,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  /** Null in "create" mode; the campaign being edited otherwise. */
  editing: Campaign | null;
  /** Which flavour of item this sheet is editing/creating. */
  kind: Kind;
  /** Receives the input WITHOUT kind — parent stamps it. */
  onCreate: (input: Omit<CampaignInput, "kind">) => Campaign;
  onUpdate: (id: string, patch: Partial<CampaignInput>) => void;
  onDelete: (id: string) => void;
}) {
  const copy = COPY[kind];
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStep, setNewStep] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (editing) {
      setName(editing.name);
      setUrl(editing.url ?? "");
      setTarget(
        editing.targetCents > 0 ? (editing.targetCents / 100).toFixed(2) : ""
      );
      setSteps(editing.steps);
    } else {
      setName("");
      setUrl("");
      setTarget("");
      setSteps([]);
    }
    setNewStep("");
    const t = setTimeout(() => nameRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open, editing]);

  const targetCents = parseAmountToCents(target);
  const cleanTarget = Number.isFinite(targetCents) && targetCents > 0 ? targetCents : 0;

  // Inline-save helpers used in edit mode.
  const saveName = () => {
    if (!editing) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === editing.name) {
      setName(editing.name);
      return;
    }
    onUpdate(editing.id, { name: trimmed });
  };
  const saveUrl = () => {
    if (!editing) return;
    const trimmed = url.trim();
    if (trimmed === (editing.url ?? "")) return;
    onUpdate(editing.id, { url: trimmed });
  };
  const saveTarget = () => {
    if (!editing) return;
    if (cleanTarget === editing.targetCents) return;
    onUpdate(editing.id, { targetCents: cleanTarget });
  };

  const commitSteps = (next: Step[]) => {
    setSteps(next);
    if (editing) onUpdate(editing.id, { steps: next });
  };
  const toggleStep = (id: string) =>
    commitSteps(
      steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  const removeStep = (id: string) =>
    commitSteps(steps.filter((s) => s.id !== id));
  const addStep = () => {
    const trimmed = newStep.trim();
    if (!trimmed) return;
    commitSteps([...steps, { id: stepId(), label: trimmed, done: false }]);
    setNewStep("");
  };

  const submitCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({
      name: trimmed,
      url: url.trim() || undefined,
      targetCents: cleanTarget,
      steps,
    });
    onClose();
  };

  const completed = steps.length > 0 && steps.every((s) => s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Sheet open={open} onClose={onClose}>
      {/* Header: logo + name */}
      <div className="flex items-center gap-3 pb-1">
        <CampaignAvatar
          name={name || editing?.name || "?"}
          url={url || editing?.url}
          size="h-12 w-12"
          textSize="text-base"
        />
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          placeholder="Nome da campanha"
          autoCapitalize="words"
          className="flex-1 rounded-xl bg-transparent px-2 py-1 text-lg font-semibold tracking-tight text-ink outline-none focus:bg-canvas-soft/40"
        />
      </div>

      <div className="space-y-2 pt-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Link do site
          </span>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={saveUrl}
            placeholder={copy.urlPlaceholder}
            className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-sm text-ink outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {copy.targetLabel}
          </span>
          <div className="mt-1 flex items-center gap-2 rounded-2xl bg-canvas-soft/40 px-4 py-3 ring-2 ring-transparent transition focus-within:bg-card-bg focus-within:ring-accent">
            <span className="text-sm text-muted">€</span>
            <input
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) =>
                setTarget(
                  e.target.value.replace(/[^0-9.,]/g, "").slice(0, 10)
                )
              }
              onBlur={saveTarget}
              placeholder="0,00"
              className="flex-1 bg-transparent text-sm font-semibold tabular-nums text-ink outline-none placeholder:text-muted-soft/60"
            />
          </div>
        </label>
      </div>

      {/* Steps */}
      <div className="pt-4">
        <div className="flex items-center justify-between px-1 pb-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
            Passos
          </h3>
          {steps.length > 0 && (
            <span
              className={`text-xs font-semibold tabular-nums ${
                completed ? "text-success" : "text-muted"
              }`}
            >
              {doneCount}/{steps.length}
            </span>
          )}
        </div>

        <ul className="space-y-1">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => toggleStep(s.id)}
                aria-pressed={s.done}
                aria-label={s.done ? "Desmarcar passo" : "Marcar passo"}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                  s.done
                    ? "border-success bg-success text-white"
                    : "border-canvas-soft bg-card-bg"
                }`}
              >
                {s.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <span
                className={`min-w-0 flex-1 text-sm ${
                  s.done ? "text-muted line-through" : "text-ink"
                }`}
              >
                {s.label}
              </span>
              <button
                type="button"
                onClick={() => removeStep(s.id)}
                aria-label="Remover passo"
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted-soft transition active:scale-90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-canvas-soft/40 px-3 py-2">
          <input
            type="text"
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStep();
              }
            }}
            placeholder="Adicionar passo"
            className="flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-muted-soft"
          />
          <button
            type="button"
            onClick={addStep}
            disabled={!newStep.trim()}
            aria-label="Adicionar passo"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-on-elevated transition active:scale-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Footer */}
      {editing ? (
        <div className="pt-4">
          {completed && cleanTarget > 0 && kind === "campaign" && (
            <div className="mb-3 rounded-2xl bg-success/10 px-4 py-2.5 text-center text-sm font-medium text-success">
              Campanha completa — {formatCents(editing.targetCents)} ganhos 🎉
            </div>
          )}
          {completed && kind === "card" && (
            <div className="mb-3 rounded-2xl bg-success/10 px-4 py-2.5 text-center text-sm font-medium text-success">
              Esquema do cartão completo 🎉
            </div>
          )}
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-2.5 text-sm font-medium text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(editing.id);
                  onClose();
                }}
                className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white"
              >
                {copy.removeConfirm}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-danger"
              >
                <Trash2 className="h-4 w-4" /> Remover
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full bg-elevated px-4 py-2.5 text-sm font-medium text-on-elevated transition active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submitCreate}
            disabled={!name.trim()}
            className="flex-1 rounded-full bg-elevated px-4 py-3 text-sm font-medium text-on-elevated transition active:scale-[0.98] disabled:opacity-40"
          >
            Criar
          </button>
        </div>
      )}
    </Sheet>
  );
}
