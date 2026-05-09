"use client";

import { ExternalLink } from "lucide-react";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/projects/status";
import type { Project } from "@/lib/projects/types";

function shortHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

export function ProjectCard({
  project,
  onTap,
}: {
  project: Project;
  onTap: () => void;
}) {
  const initial = project.name[0]?.toUpperCase() ?? "?";

  return (
    <button
      type="button"
      onClick={onTap}
      className="card flex w-full items-start gap-3 p-4 text-left transition active:scale-[0.99]"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-[0_8px_20px_-10px_rgba(15,12,41,0.45)]"
        style={{
          background: `linear-gradient(160deg, ${project.color}, ${project.color}cc)`,
        }}
      >
        {project.emoji ?? initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            {project.name}
          </h3>
          <span
            className="flex shrink-0 items-center gap-1 rounded-full bg-canvas-soft/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted"
            aria-label={STATUS_LABEL[project.status]}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: STATUS_COLOR[project.status] }}
            />
            {STATUS_LABEL[project.status]}
          </span>
        </div>

        {project.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
            {project.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-canvas-soft/50 px-2 py-0.5 text-[11px] font-medium text-ink/80"
            >
              #{t}
            </span>
          ))}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-accent"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="max-w-[140px] truncate">
                {shortHost(project.url)}
              </span>
            </a>
          )}
        </div>
      </div>
    </button>
  );
}
