"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Trip, TripInput, TripPhoto } from "./types";
import { createTrip, deleteTrip, fetchTrips, patchTrip } from "./api";

function tempId(): string {
  return `temp_t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Same optimistic pattern as useProjects: update locally, sync in the
 *  background, refetch if the server disagrees. */
export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconcileScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      setTrips(await fetchTrips());
    } catch {
      /* 401 redirects; keep optimistic state otherwise */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchTrips();
        if (!cancelled) setTrips(fresh);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erro");
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleReconcile = useCallback(() => {
    if (reconcileScheduled.current) return;
    reconcileScheduled.current = true;
    setTimeout(() => {
      reconcileScheduled.current = false;
      void refetch();
    }, 300);
  }, [refetch]);

  /** Returns the temp id so the caller can navigate once it's swapped. */
  const addTrip = useCallback((input: TripInput, onCreated?: (trip: Trip) => void) => {
    const now = Date.now();
    const optimistic: Trip = { ...input, photos: [], id: tempId(), createdAt: now, updatedAt: now };
    setTrips((prev) => [optimistic, ...prev]);
    void (async () => {
      try {
        const created = await createTrip(input);
        setTrips((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
        onCreated?.(created);
      } catch (e) {
        setTrips((prev) => prev.filter((t) => t.id !== optimistic.id));
        setError(e instanceof Error ? e.message : "Erro ao criar a viagem");
      }
    })();
  }, []);

  const updateTrip = useCallback(
    (id: string, patch: Partial<TripInput>) => {
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t))
      );
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await patchTrip(id, patch);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const removeTrip = useCallback(
    (id: string) => {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteTrip(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  /** Local-only: the photo routes already persisted the change. */
  const setTripPhotos = useCallback(
    (id: string, update: (photos: TripPhoto[]) => TripPhoto[]) => {
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, photos: update(t.photos) } : t))
      );
    },
    []
  );

  return { trips, hydrated, error, addTrip, updateTrip, removeTrip, setTripPhotos };
}
