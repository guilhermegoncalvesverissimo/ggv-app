"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { parseAmountToCents } from "@/lib/wallet/format";
import {
  KIND_META,
  KIND_ORDER,
  type TripItem,
  type TripItemKind,
} from "@/lib/viagens/types";
import { DateTimeInput, DeleteRow, Field, SheetActions, inputCls } from "./fields";

export type ItemValues = Omit<TripItem, "id">;

/** Add/edit one entry of the itinerary (a flight, a hotel, a dinner…). */
export function ItemSheet({
  open,
  onClose,
  onSubmit,
  onDelete,
  item,
  defaultDate,
  minDate,
  maxDate,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ItemValues) => void;
  onDelete?: () => void;
  item?: TripItem | null;
  defaultDate?: string;
  minDate?: string;
  maxDate?: string;
}) {
  const isEdit = !!item;
  const [kind, setKind] = useState<TripItemKind>("atividade");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form whenever the sheet opens (or switches item) — done while
  // rendering rather than in an effect, so it never paints stale values.
  const formKey = open ? `${item?.id ?? "new"}|${defaultDate ?? ""}` : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setConfirmDelete(false);
    if (open) {
      setKind(item?.kind ?? "atividade");
      setTitle(item?.title ?? "");
      setDate(item?.date ?? defaultDate ?? "");
      setTime(item?.time ?? "");
      setPlace(item?.place ?? "");
      setLink(item?.link ?? "");
      setNotes(item?.notes ?? "");
      setCost(item?.costCents != null ? String(item.costCents / 100) : "");
    }
  }

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    const cents = parseAmountToCents(cost);
    onSubmit({
      kind,
      title: t,
      date: date || undefined,
      time: time || undefined,
      place: place.trim() || undefined,
      link: link.trim() || undefined,
      notes: notes.trim() || undefined,
      costCents: Number.isFinite(cents) ? cents : undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
        {isEdit ? "Editar" : "Adicionar ao roteiro"}
      </h2>

      <form
        className="max-h-[75dvh] space-y-3 overflow-y-auto pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex flex-wrap gap-2">
          {KIND_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] ${
                kind === k ? "bg-elevated text-white" : "bg-canvas-soft/40 text-ink"
              }`}
            >
              <span aria-hidden>{KIND_META[k].emoji}</span>
              {KIND_META[k].label}
            </button>
          ))}
        </div>

        <Field label="O quê">
          <input
            type="text"
            autoCapitalize="sentences"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "voo"
                ? "Ex.: LIS → FCO, TP 836"
                : kind === "alojamento"
                  ? "Ex.: Hotel Artemide"
                  : "Ex.: Coliseu"
            }
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <Field label="Dia">
            <DateTimeInput type="date" value={date} min={minDate} max={maxDate} onChange={setDate} hint="Escolher" />
          </Field>
          <Field label="Hora">
            <DateTimeInput type="time" value={time} onChange={setTime} hint="--:--" />
          </Field>
        </div>

        <Field label="Local">
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Morada ou ponto de encontro (opcional)"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <Field label="Link">
            <input
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoComplete="off"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Reserva, bilhete…"
              className={inputCls}
            />
          </Field>
          <Field label="Custo (€)">
            <input
              type="text"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Notas">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Código de reserva, o que levar… (opcional)"
            className={`${inputCls} resize-none text-sm`}
          />
        </Field>

        <SheetActions
          onCancel={onClose}
          submitLabel={isEdit ? "Guardar" : "Adicionar"}
          disabled={!title.trim()}
        />

        {isEdit && onDelete && (
          <DeleteRow
            label="Remover do roteiro"
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
