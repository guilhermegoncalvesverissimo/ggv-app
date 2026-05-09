"use client";

import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { usePeople } from "@/lib/networking/usePeople";
import { encountersInLastDays } from "@/lib/networking/sizing";
import { Bubble } from "./Bubble";
import { AddPersonSheet } from "./AddPersonSheet";
import { PersonDetailSheet } from "./PersonDetailSheet";

export function NetworkingBoard() {
  const {
    people,
    hydrated,
    addPerson,
    removePerson,
    renamePerson,
    setAvatar,
    logEncounter,
    removeEncounter,
  } = usePeople();

  const [addOpen, setAddOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const open = useMemo(
    () => people.find((p) => p.id === openId) ?? null,
    [people, openId]
  );

  const stats = useMemo(() => {
    const all = people.flatMap((p) => p.encounters);
    return {
      people: people.length,
      total: all.length,
      week: encountersInLastDays(all, 7),
    };
  }, [people]);

  // Sort: most encounters first, then most recent.
  const ordered = useMemo(
    () =>
      [...people].sort(
        (a, b) =>
          b.encounters.length - a.encounters.length ||
          (b.encounters.at(-1)?.at ?? b.createdAt) -
            (a.encounters.at(-1)?.at ?? a.createdAt)
      ),
    [people]
  );

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  return (
    <>
      {people.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 pb-1">
            <Stat label="Pessoas" value={stats.people} />
            <Stat label="Encontros" value={stats.total} />
            <Stat label="Esta semana" value={stats.week} />
          </div>

          <section className="card">
            <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-6">
              {ordered.map((person) => (
                <Bubble
                  key={person.id}
                  person={person}
                  onTap={() => setOpenId(person.id)}
                  onLongPress={() => logEncounter(person.id)}
                />
              ))}
            </div>
            <p className="border-t border-canvas-soft/40 px-5 py-3 text-center text-xs text-muted">
              Mantém pressionada uma bolha para registar um encontro. Toca para
              ver detalhes.
            </p>
          </section>
        </>
      ) : (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Users className="h-6 w-6 text-accent" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Ainda sem pessoas
          </h2>
          <p className="max-w-xs text-sm text-muted">
            Adiciona o teu primeiro contacto e começa a contar encontros com um
            long-press na bolha.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition active:scale-95"
          >
            Adicionar pessoa
          </button>
        </div>
      )}

      {/* Floating "+" — only when there are already bubbles */}
      {people.length > 0 && (
        <button
          type="button"
          aria-label="Adicionar pessoa"
          onClick={() => setAddOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <AddPersonSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addPerson}
      />
      <PersonDetailSheet
        person={open}
        onClose={() => setOpenId(null)}
        onLogEncounter={logEncounter}
        onRemoveEncounter={removeEncounter}
        onRename={renamePerson}
        onSetAvatar={setAvatar}
        onRemove={removePerson}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col items-center justify-center px-2 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
