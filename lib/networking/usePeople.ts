"use client";

import { useCallback, useEffect, useState } from "react";
import { type Person, STORAGE_KEY } from "./types";

function readStorage(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Person[];
  } catch {
    return [];
  }
}

function writeStorage(people: Person[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
  } catch {
    // quota / privacy mode — silently ignore for now.
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

  const addPerson = useCallback((name: string, badge?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPeople((prev) => [
      ...prev,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        badge: badge?.trim() || undefined,
        encounters: [],
        createdAt: Date.now(),
      },
    ]);
  }, []);

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

  const logEncounter = useCallback((id: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, encounters: [...p.encounters, { at: Date.now() }] }
          : p
      )
    );
  }, []);

  const undoLastEncounter = useCallback((id: string) => {
    setPeople((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, encounters: p.encounters.slice(0, -1) }
          : p
      )
    );
  }, []);

  return {
    people,
    hydrated,
    addPerson,
    removePerson,
    renamePerson,
    logEncounter,
    undoLastEncounter,
  };
}
