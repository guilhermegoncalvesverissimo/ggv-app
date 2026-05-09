"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import type { Person } from "@/lib/networking/types";
import { encountersInLastDays } from "@/lib/networking/sizing";
import { AvatarPicker } from "./AvatarPicker";
import { EncounterTimeline } from "./EncounterTimeline";

export function PersonDetailSheet({
  person,
  onClose,
  onLogEncounter,
  onRemoveEncounter,
  onRename,
  onSetAvatar,
  onRemove,
}: {
  person: Person | null;
  onClose: () => void;
  onLogEncounter: (id: string) => void;
  onRemoveEncounter: (personId: string, encounterId: string) => void;
  onRename: (id: string, name: string) => void;
  onSetAvatar: (id: string, avatar: string | undefined) => void;
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
    return (
      <Sheet open={false} onClose={onClose}>
        {null}
      </Sheet>
    );
  }

  const week = encountersInLastDays(person.encounters, 7);
  const month = encountersInLastDays(person.encounters, 30);

  return (
    <Sheet open onClose={onClose}>
      <div className="flex items-center gap-3 pb-1">
        <AvatarPicker
          name={person.name}
          badge={person.badge}
          value={person.avatar}
          onChange={(next) => onSetAvatar(person.id, next)}
          size={64}
        />
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

      <button
        type="button"
        onClick={() => onLogEncounter(person.id)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" /> Registar encontro
      </button>

      <div className="pt-4">
        <h3 className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Histórico
        </h3>
        <EncounterTimeline
          encounters={person.encounters}
          onDelete={(encounterId) =>
            onRemoveEncounter(person.id, encounterId)
          }
        />
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
            <Trash2 className="h-4 w-4" /> Remover pessoa
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
