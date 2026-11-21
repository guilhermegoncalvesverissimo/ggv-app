"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { DateTimeInput, DeleteRow, Field, SheetActions, inputCls } from "@/components/viagens/fields";
import { singleEmoji } from "@/lib/emoji";
import { ACCOUNT_COLORS } from "@/lib/wallet/colors";
import type { EventInput } from "@/lib/wallet/events";
import type { WalletEvent } from "@/lib/wallet/types";

/** Add/edit an event (a weekend away, a wedding…). */
export function EventFormSheet({
  open,
  onClose,
  onSubmit,
  onDelete,
  event,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: EventInput) => void;
  onDelete?: () => void;
  event?: WalletEvent | null;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[3]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset when (re)opened — during render, not in an effect.
  const formKey = open ? (event?.id ?? "new") : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setConfirmDelete(false);
    if (open) {
      setName(event?.name ?? "");
      setEmoji(event?.emoji ?? "");
      setColor(event?.color ?? ACCOUNT_COLORS[3]);
      setStartDate(event?.startDate ?? "");
      setEndDate(event?.endDate ?? "");
    }
  }

  const datesInvalid = !!startDate && !!endDate && endDate < startDate;

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
        {event ? "Editar evento" : "Novo evento"}
      </h2>
      <form
        className="-mx-1 max-h-[75dvh] space-y-3 overflow-y-auto px-1 pb-1 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || datesInvalid) return;
          onSubmit({
            name: name.trim(),
            emoji: emoji || undefined,
            color,
            startDate: startDate || undefined,
            endDate: endDate || startDate || undefined,
          });
          onClose();
        }}
      >
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Field label="Emoji">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(singleEmoji(e.target.value))}
              placeholder="🏖️"
              className="mt-1 block h-12 w-14 rounded-2xl bg-canvas-soft/40 px-0 py-0 text-center text-xl leading-none outline-none ring-2 ring-transparent transition focus:bg-card-bg focus:ring-accent"
            />
          </Field>
          <Field label="Nome">
            <input
              type="text"
              autoCapitalize="sentences"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Fim de semana no Porto"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="De">
            <DateTimeInput type="date" value={startDate} onChange={setStartDate} hint="Opcional" />
          </Field>
          <Field label="Até">
            <DateTimeInput type="date" value={endDate} min={startDate || undefined} onChange={setEndDate} hint="Opcional" />
          </Field>
        </div>
        <p className="-mt-1 px-1 text-xs text-muted">
          Com datas, ao adicionares despesas aparecem primeiro as desses dias.
        </p>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Cor</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                className={`relative h-8 w-8 rounded-full transition active:scale-95 ${color === c ? "ring-2 ring-ink ring-offset-2" : ""}`}
                style={{ background: c }}
              >
                {color === c && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <SheetActions
          onCancel={onClose}
          submitLabel={event ? "Guardar" : "Criar evento"}
          disabled={!name.trim() || datesInvalid}
        />
        {event && onDelete && (
          <DeleteRow
            label="Apagar evento (as despesas ficam)"
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
