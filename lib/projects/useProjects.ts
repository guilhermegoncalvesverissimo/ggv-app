"use client";

import { useCallback, useEffect, useState } from "react";
import { type Project, STORAGE_KEY } from "./types";

function readStorage(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Project[];
  } catch {
    return [];
  }
}

function writeStorage(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // quota / privacy mode — silently ignore.
  }
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(projects);
  }, [projects, hydrated]);

  const addProject = useCallback((input: ProjectInput) => {
    const now = Date.now();
    setProjects((prev) => [
      ...prev,
      { ...input, id: newId(), createdAt: now, updatedAt: now },
    ]);
  }, []);

  const updateProject = useCallback(
    (id: string, patch: Partial<ProjectInput>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
        )
      );
    },
    []
  );

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    projects,
    hydrated,
    addProject,
    updateProject,
    removeProject,
  };
}
