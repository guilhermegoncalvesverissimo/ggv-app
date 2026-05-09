"use client";

import { useCallback, useEffect, useState } from "react";
import { type Person, STORAGE_KEY } from "./types";

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Read storage and migrate any legacy encounters that don't yet have an id.
 * Older versions stored encounters as `{ at: number }` only.
 */
function readStorage(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Person[]).map((p) => ({
      ...p,
      encounters: (p.encounters ?? []).map((e) =>
        e.id ? e : { ...e, id: newId("e") }
      ),
    }));
  } catch {
    return [];
  }
}

function writeStorage(people: Person[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  } catch {
    // quota / privacy mode — silently ignore.
  }
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPeople(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(people);
  }, [people, hydrated]);

  const addPerson = useCallback(
    (input: { name: string; badge?: string; avatar?: string }) => {
      const trimmed = input.name.trim();
      if (!trimmed) return;
      setPeople((prev) => [
        ...prev,
        {
          id: newId("p"),
          name: trimmed,
          badge: input.badge?.trim() || undefined,
          avatar: input.avatar,
          encounters: [],
          createdAt: Date.now(),
        },
      ]);
    },
    []
  );

  const removePerson = useCallback((id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renamePerson = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
    );
  }, []);

  const setAvatar = useCallback(
    (id: string, avatar: string | undefined) => {
      setPeople((prev) =>
        prev.map((p) => (p.id === id ? { ...p, avatar } : p))
      );
    },
    []
  );

  const logEncounter = useCallback((id: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              encounters: [
                ...p.encounters,
                { id: newId("e"), at: Date.now() },
              ],
            }
          : p
      )
    );
  }, []);

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
    },
    []
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
