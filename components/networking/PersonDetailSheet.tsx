"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { Person } from "@/lib/networking/types";
import { colorFor, initialsOf } from "@/lib/networking/colors";
import { encountersInLastDays } from "@/lib/networking/sizing";
import { Trash2, Undo2, Plus } from "lucide-react";

function fmtRelative(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(ts).toLocaleDateString("pt-PT");
}

export function PersonDetailSheet({
  person,
  onClose,
  onLogEncounter,
  onUndoLast,
  onRename,
  onRemove,
}: {
  person: Person | null;
  onClose: () => void;
  onLogEncounter: (id: string) => void;
  onUndoLast: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setConfirmDelete(false);
    }
  }, [person]);

  if (!person) {
    return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  }

  const color = colorFor(person.id + person.name);
  const week = encountersInLastDays(person.encounters, 7);
  const month = encountersInLastDays(person.encounters, 30);
  const last = person.encounters[person.encounters.length - 1];

  return (
    <Sheet open onClose={onClose}>
      <div className="flex items-center gap-3 pb-1">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-white font-semibold"
          style={{ background: `linear-gradient(160deg, ${color}, ${color}cc)` }}
        >
          {person.badge || initialsOf(person.name)}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== person.name) onRename(person.id, name);
            else setName(person.name);
          }}
          className="flex-1 rounded-xl bg-transparent text-xl font-semibold tracking-tight text-ink outline-none focus:bg-canvas-soft/40 px-2 py-1"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3">
        <Stat label="Total" value={person.encounters.length} />
        <Stat label="7 dias" value={week} />
        <Stat label="30 dias" value={month} />
      </div>

      {last && (
        <p className="pt-3 text-sm text-muted">
          Último encontro {fmtRelative(last.at)}.
        </p>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={() => onLogEncounter(person.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Registar encontro
        </button>
        <button
          type="button"
          disabled={person.encounters.length === 0}
          onClick={() => onUndoLast(person.id)}
          aria-label="Desfazer último encontro"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas-soft/50 text-ink transition active:scale-[0.98] disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="pt-3">
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
                onRemove(person.id);
                onClose();
              }}
              className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white"
            >
              Apagar mesmo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-danger"
          >
            <Trash2 className="h-4 w-4" /> Remover
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-canvas-soft/40 p-3 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
