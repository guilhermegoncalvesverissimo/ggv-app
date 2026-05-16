"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "./types";
import {
  createProject,
  deleteProject,
  fetchProjects,
  patchProject,
} from "./api";

const LEGACY_KEY = "ggv:projects:v1";
const MIGRATED_FLAG = "ggv:projects:migrated";

export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

function tempId(): string {
  return `temp_p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readLegacy(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
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
function markMigrated() {
  try {
    window.localStorage.setItem(MIGRATED_FLAG, "true");
  } catch {
    /* ignore */
  }
}

async function migrateLegacy(): Promise<void> {
  for (const p of readLegacy()) {
    try {
      await createProject({
        name: p.name,
        description: p.description,
        url: p.url,
        tags: p.tags ?? [],
        status: p.status,
        emoji: p.emoji,
        color: p.color,
        createdAt: p.createdAt,
      });
    } catch {
      /* skip and continue — partial-failure tolerant */
    }
  }
  markMigrated();
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const reconcileScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      setProjects(await fetchProjects());
    } catch {
      /* 401 redirects; keep optimistic state otherwise */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchProjects();
        if (cancelled) return;
        if (
          fresh.length === 0 &&
          !hasMigrated() &&
          readLegacy().length > 0
        ) {
          await migrateLegacy();
          const final = await fetchProjects();
          if (cancelled) return;
          setProjects(final);
        } else {
          markMigrated();
          setProjects(fresh);
        }
      } catch {
        /* swallow */
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

  const addProject = useCallback((input: ProjectInput) => {
    const now = Date.now();
    const optimistic: Project = {
      ...input,
      id: tempId(),
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [optimistic, ...prev]);
    void (async () => {
      try {
        const created = await createProject(input);
        setProjects((prev) =>
          prev.map((p) => (p.id === optimistic.id ? created : p))
        );
      } catch {
        setProjects((prev) => prev.filter((p) => p.id !== optimistic.id));
      }
    })();
  }, []);

  const updateProject = useCallback(
    (id: string, patch: Partial<ProjectInput>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
        )
      );
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await patchProject(id, patch);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  const removeProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await deleteProject(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  return {
    projects,
    hydrated,
    addProject,
    updateProject,
    removeProject,
  };
}
