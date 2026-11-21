"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ACCOUNT_COLORS } from "@/lib/wallet/colors";
import { parseAmountToCents } from "@/lib/wallet/format";
import type { Trip } from "@/lib/viagens/types";
import { DateTimeInput, DeleteRow, Field, SheetActions, inputCls } from "./fields";
import { singleEmoji } from "@/lib/emoji";

export type TripFormValues = {
  name: string;
  destination?: string;
  emoji?: string;
  color: string;
  startDate?: string;
  endDate?: string;
  budgetCents?: number;
};

const DEFAULT_COLOR = ACCOUNT_COLORS[1];

/** Add/edit sheet for a trip's basics. Pass `trip` for edit mode. */
export function TripFormSheet({
  open,
  onClose,
  onSubmit,
  onDelete,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TripFormValues) => void;
  onDelete?: () => void;
  trip?: Trip | null;
}) {
  const isEdit = !!trip;
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form whenever the sheet opens — done while rendering rather
  // than in an effect, so it never paints stale values.
  const formKey = open ? (trip?.id ?? "new") : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setConfirmDelete(false);
    if (open) {
      setName(trip?.name ?? "");
      setDestination(trip?.destination ?? "");
      setEmoji(trip?.emoji ?? "");
      setColor(trip?.color ?? DEFAULT_COLOR);
      setStartDate(trip?.startDate ?? "");
      setEndDate(trip?.endDate ?? "");
      setBudget(trip?.budgetCents != null ? String(trip.budgetCents / 100) : "");
    }
  }

  const datesInvalid = !!startDate && !!endDate && endDate < startDate;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed || datesInvalid) return;
    const cents = parseAmountToCents(budget);
    onSubmit({
      name: trimmed,
      destination: destination.trim() || undefined,
      emoji: emoji.trim() || undefined,
      color,
      startDate: startDate || undefined,
      endDate: endDate || startDate || undefined,
      budgetCents: Number.isFinite(cents) ? cents : undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
        {isEdit ? "Editar viagem" : "Nova viagem"}
      </h2>

      <form
        className="-mx-1 max-h-[75dvh] space-y-3 overflow-y-auto px-1 pb-1 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Field label="Emoji">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(singleEmoji(e.target.value))}
              placeholder="🌴"
              className="mt-1 block h-12 w-14 rounded-2xl bg-canvas-soft/40 px-0 py-0 text-center text-xl leading-none outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent"
            />
          </Field>
          <Field label="Nome">
            <input
              type="text"
              autoCapitalize="sentences"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Fim de semana em Roma"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Destino">
          <input
            type="text"
            autoCapitalize="words"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Cidade, país (opcional)"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Ida">
            <DateTimeInput type="date" value={startDate} onChange={setStartDate} hint="Escolher" />
          </Field>
          <Field label="Volta">
            <DateTimeInput type="date" value={endDate} min={startDate || undefined} onChange={setEndDate} hint="Escolher" />
          </Field>
        </div>
        {datesInvalid && (
          <p className="-mt-1 px-1 text-xs text-danger">
            A volta não pode ser antes da ida.
          </p>
        )}

        <Field label="Orçamento (€)">
          <input
            type="text"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Opcional"
            className={inputCls}
          />
        </Field>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Cor
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                className={`relative h-8 w-8 rounded-full transition active:scale-95 ${
                  color === c ? "ring-2 ring-ink ring-offset-2" : ""
                }`}
                style={{ background: c }}
              >
                {color === c && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <SheetActions
          onCancel={onClose}
          submitLabel={isEdit ? "Guardar" : "Criar viagem"}
          disabled={!name.trim() || datesInvalid}
        />

        {isEdit && onDelete && (
          <DeleteRow
            label="Apagar viagem"
            confirming={confirmDelete}
            setConfirming={setConfirmDelete}
            onConfirm={() => {
              onDelete();
              onClose();
            }}
          />
        )}
      </form>
    </Sheet>
  );
}
