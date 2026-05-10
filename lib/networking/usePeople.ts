"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Person } from "./types";
import {
  createPerson,
  deleteEncounter,
  deletePerson,
  fetchPeople,
  logEncounter as apiLogEncounter,
  patchPerson,
} from "./api";

/** Pre-Supabase shape: legacy localStorage data lived here. We read it once
 *  on first authenticated load and push it to the API, then mark it migrated. */
const LEGACY_STORAGE_KEY = "ggv:people:v1";
const MIGRATED_FLAG = "ggv:people:migrated";

function tempId(prefix: string): string {
  return `temp_${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function readLegacy(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Person[]) : [];
  } catch {
    return [];
  }
}

function markMigrated() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MIGRATED_FLAG, "true");
  } catch {
    /* ignore */
  }
}

function hasMigrated(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(MIGRATED_FLAG) === "true";
  } catch {
    return false;
  }
}

async function migrateLegacyData(): Promise<void> {
  const legacy = readLegacy();
  for (const p of legacy) {
    let created: Person;
    try {
      created = await createPerson({
        name: p.name,
        badge: p.badge,
        avatar: p.avatar,
      });
    } catch {
      continue; // partial-failure tolerant: skip and move on
    }
    for (const e of p.encounters ?? []) {
      try {
        await apiLogEncounter(created.id, e.at);
      } catch {
        /* skip and continue */
      }
    }
  }
  markMigrated();
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const refetchScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetchPeople();
      setPeople(fresh);
    } catch {
      // 401 is handled by the api wrapper (redirect). Other errors leave the
      // optimistic state in place.
    }
  }, []);

  // Initial load + one-shot migration.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchPeople();
        if (cancelled) return;

        if (fresh.length === 0 && !hasMigrated() && readLegacy().length > 0) {
          await migrateLegacyData();
          const final = await fetchPeople();
          if (cancelled) return;
          setPeople(final);
        } else {
          markMigrated(); // nothing to migrate on this device
          setPeople(fresh);
        }
      } catch {
        /* swallow: api.ts redirects on 401, other errors keep us empty */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** After an optimistic mutation, refetch in the background to reconcile. */
  const scheduleReconcile = useCallback(() => {
    if (refetchScheduled.current) return;
    refetchScheduled.current = true;
    setTimeout(() => {
      refetchScheduled.current = false;
      void refetch();
    }, 300);
  }, [refetch]);

  const addPerson = useCallback(
    (input: { name: string; badge?: string; avatar?: string }) => {
      const trimmed = input.name.trim();
      if (!trimmed) return;
      const optimistic: Person = {
        id: tempId("p"),
        name: trimmed,
        badge: input.badge?.trim() || undefined,
        avatar: input.avatar,
        encounters: [],
        createdAt: Date.now(),
      };
      setPeople((prev) => [...prev, optimistic]);

      void (async () => {
        try {
          const created = await createPerson({
            name: trimmed,
            badge: input.badge,
            avatar: input.avatar,
          });
          setPeople((prev) =>
            prev.map((p) => (p.id === optimistic.id ? created : p))
          );
        } catch {
          // Roll back the optimistic insert.
          setPeople((prev) => prev.filter((p) => p.id !== optimistic.id));
        }
      })();
    },
    []
  );

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    void (async () => {
      try {
        await deletePerson(id);
      } catch {
        scheduleReconcile();
      }
    })();
  }, [scheduleReconcile]);

  const renamePerson = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
      );
      void (async () => {
        try {
          await patchPerson(id, { name: trimmed });
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const setAvatar = useCallback(
    (id: string, avatar: string | undefined) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, avatar } : p))
      );
      void (async () => {
        try {
          await patchPerson(id, { avatar: avatar ?? null });
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const logEncounter = useCallback(
    (id: string) => {
      const temp = { id: tempId("e"), at: Date.now() };
      setPeople((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, encounters: [...p.encounters, temp] } : p
        )
      );
      // Skip the API call for optimistic-only entries on persons that haven't
      // been confirmed yet — they'll be re-created when their parent settles.
      if (id.startsWith("temp_")) return;

      void (async () => {
        try {
          const created = await apiLogEncounter(id);
          setPeople((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    encounters: p.encounters.map((e) =>
                      e.id === temp.id ? created : e
                    ),
                  }
                : p
            )
          );
        } catch {
          // Roll back the local encounter.
          setPeople((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    encounters: p.encounters.filter((e) => e.id !== temp.id),
                  }
                : p
            )
          );
        }
      })();
    },
    []
  );

  const removeEncounter = useCallback(
    (personId: string, encounterId: string) => {
      setPeople((prev) =>
        prev.map((p) =>
          p.id === personId
            ? {
                ...p,
                encounters: p.encounters.filter((e) => e.id !== encounterId),
              }
            : p
        )
      );
      if (encounterId.startsWith("temp_") || personId.startsWith("temp_")) {
        return;
      }
      void (async () => {
        try {
          await deleteEncounter(personId, encounterId);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  return {
    people,
    hydrated,
    addPerson,
    removePerson,
    renamePerson,
    setAvatar,
    logEncounter,
    removeEncounter,
  };
}
