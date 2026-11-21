"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Plus } from "lucide-react";
import { useTrips } from "@/lib/viagens/useTrips";
import { tripPhase } from "@/lib/viagens/dates";
import type { Trip } from "@/lib/viagens/types";
import { TripCard } from "./TripCard";
import { TripFormSheet, type TripFormValues } from "./TripFormSheet";

export function TripsBoard() {
  const router = useRouter();
  const { trips, hydrated, error, addTrip } = useTrips();
  const [addOpen, setAddOpen] = useState(false);

  const groups = useMemo(() => {
    const upcoming: Trip[] = [];
    const undated: Trip[] = [];
    const past: Trip[] = [];
    for (const t of trips) {
      const phase = tripPhase(t.startDate, t.endDate);
      if (phase === "terminada") past.push(t);
      else if (phase === "sem-data") undated.push(t);
      else upcoming.push(t);
    }
    upcoming.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
    undated.sort((a, b) => b.updatedAt - a.updatedAt);
    past.sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
    return [
      { title: "Próximas", trips: upcoming },
      { title: "Por marcar", trips: undated },
      { title: "Já feitas", trips: past },
    ].filter((g) => g.trips.length > 0);
  }, [trips]);

  const create = (values: TripFormValues) =>
    addTrip({ ...values, items: [], checklist: [] }, (trip) =>
      router.push(`/viagens/${trip.id}`)
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
      {error && (
        <div className="card p-4 text-sm text-danger">{error}</div>
      )}

      {trips.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Plane className="h-6 w-6 text-accent" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Nenhuma viagem ainda</h2>
          <p className="max-w-xs text-sm text-muted">
            Cria uma viagem para montares o roteiro, a checklist da mala e o orçamento.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-2 rounded-full bg-elevated px-5 py-2.5 text-sm font-medium text-white transition active:scale-95"
          >
            Nova viagem
          </button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="space-y-3">
            <h2 className="px-1 pt-1 text-xs font-medium uppercase tracking-wide text-muted">
              {g.title}
            </h2>
            {g.trips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </section>
        ))
      )}

      {trips.length > 0 && (
        <button
          type="button"
          aria-label="Nova viagem"
          onClick={() => setAddOpen(true)}
          className="fixed bottom-[calc(var(--nav-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <TripFormSheet open={addOpen} onClose={() => setAddOpen(false)} onSubmit={create} />
    </>
  );
}
