"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";

export function AddPersonSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, badge?: string) => void;
}) {
  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setBadge("");
      // small delay so the sheet animates in before the keyboard pops on iOS
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name, badge);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="px-1 text-lg font-semibold tracking-tight">
        Adicionar pessoa
      </h2>
      <p className="px-1 pt-1 text-sm text-muted">
        Cada pessoa começa como uma bolha pequena. Mantém pressionada a bolha
        para registar mais um encontro.
      </p>

      <form
        className="space-y-3 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Nome
          </span>
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="words"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Boris Cherny"
            className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Emoji ou tag (opcional)
          </span>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value.slice(0, 4))}
            placeholder="Ex.: 🚀 ou 💼"
            className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </form>
    </Sheet>
  );
}
