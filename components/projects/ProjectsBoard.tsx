"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { useProjects } from "@/lib/projects/useProjects";
import { STATUS_ORDER } from "@/lib/projects/status";
import type { ProjectStatus } from "@/lib/projects/types";
import { ProjectCard } from "./ProjectCard";
import {
  ProjectFormSheet,
  type ProjectFormValues,
} from "./ProjectFormSheet";
import { StatusChips, type StatusFilter } from "./StatusChips";

export function ProjectsBoard() {
  const { projects, hydrated, addProject, updateProject, removeProject } =
    useProjects();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const editing = useMemo(
    () => projects.find((p) => p.id === editId) ?? null,
    [projects, editId]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: projects.length,
      active: 0,
      idea: 0,
      paused: 0,
      done: 0,
    };
    for (const p of projects) c[p.status]++;
    return c;
  }, [projects]);

  // Sort: status priority (active first), then most recently updated.
  const ordered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
          b.updatedAt - a.updatedAt
      ),
    [filtered]
  );

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <FolderKanban className="h-6 w-6 text-accent" strokeWidth={2.25} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Portfolio vazio
          </h2>
          <p className="max-w-xs text-sm text-muted">
            Cria o teu primeiro projeto para o veres listado aqui.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition active:scale-95"
          >
            Novo projeto
          </button>
        </div>

        <ProjectFormSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSubmit={(values: ProjectFormValues) => addProject(values)}
        />
      </>
    );
  }

  const handleEditSubmit = (values: ProjectFormValues) => {
    if (!editId) return;
    updateProject(editId, values);
  };

  return (
    <>
      <StatusChips value={filter} counts={counts} onChange={setFilter} />

      {ordered.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted">
          Sem projetos com este estado.
        </div>
      ) : (
        <div className="space-y-3">
          {ordered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onTap={() => setEditId(project.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        aria-label="Novo projeto"
        onClick={() => setAddOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_18px_40px_-12px_rgba(15,12,41,0.55)] transition active:scale-95"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <ProjectFormSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(values: ProjectFormValues) => addProject(values)}
      />
      <ProjectFormSheet
        open={!!editing}
        onClose={() => setEditId(null)}
        project={editing}
        onSubmit={handleEditSubmit}
        onDelete={() => editId && removeProject(editId)}
      />
    </>
  );
}

// ProjectStatus re-export so existing imports keep working from this file
export type { ProjectStatus };
