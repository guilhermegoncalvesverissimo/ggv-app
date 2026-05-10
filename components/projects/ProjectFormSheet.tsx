"use client";

import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ACCOUNT_COLORS, DEFAULT_ACCOUNT_COLOR } from "@/lib/wallet/colors";
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_ORDER,
} from "@/lib/projects/status";
import type { Project, ProjectStatus } from "@/lib/projects/types";
import { TagsInput } from "./TagsInput";

export type ProjectFormValues = {
  name: string;
  description?: string;
  url?: string;
  tags: string[];
  status: ProjectStatus;
  emoji?: string;
  color: string;
};

/**
 * Single sheet that handles both "add" and "edit" modes. Pass `project` for
 * edit, or omit it for add.
 */
export function ProjectFormSheet({
  open,
  onClose,
  onSubmit,
  onDelete,
  project,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
  onDelete?: () => void;
  project?: Project | null;
}) {
  const isEdit = !!project;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_ACCOUNT_COLOR);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setUrl(project.url ?? "");
      setTags(project.tags);
      setStatus(project.status);
      setEmoji(project.emoji ?? "");
      setColor(project.color);
    } else {
      setName("");
      setDescription("");
      setUrl("");
      setTags([]);
      setStatus("active");
      setEmoji("");
      setColor(DEFAULT_ACCOUNT_COLOR);
    }
  }, [open, project]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      tags,
      status,
      emoji: emoji.trim() || undefined,
      color,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
        {isEdit ? "Editar projeto" : "Novo projeto"}
      </h2>

      <form
        className="space-y-3 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Emoji
            </span>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              placeholder="🚀"
              className="mt-1 w-14 rounded-2xl bg-canvas-soft/40 px-3 py-3 text-center text-lg outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Nome
            </span>
            <input
              type="text"
              autoFocus={!isEdit}
              autoCapitalize="words"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: GGV App"
              className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Descrição
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 280))}
            placeholder="Em que consiste? (opcional)"
            rows={2}
            className="mt-1 w-full resize-none rounded-2xl bg-canvas-soft/40 px-4 py-3 text-sm text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Link
          </span>
          <input
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-sm text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
          />
        </label>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Tags
          </span>
          <TagsInput value={tags} onChange={setTags} />
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Estado
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition active:scale-[0.98] ${
                  status === s
                    ? "bg-elevated text-white"
                    : "bg-canvas-soft/40 text-ink"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLOR[s] }}
                />
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Cor
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Cor ${c}`}
                className={`relative h-8 w-8 rounded-full transition active:scale-95 ${
                  color === c ? "ring-2 ring-ink ring-offset-2" : ""
                }`}
                style={{ background: c }}
              >
                {color === c && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
          >
            {isEdit ? "Guardar" : "Criar projeto"}
          </button>
        </div>

        {isEdit && onDelete && (
          <div className="pt-1">
            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-2.5 text-sm font-medium text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="flex-1 rounded-full bg-danger px-4 py-2.5 text-sm font-medium text-white"
                >
                  Apagar mesmo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-danger"
              >
                <Trash2 className="h-4 w-4" /> Remover projeto
              </button>
            )}
          </div>
        )}
      </form>
    </Sheet>
  );
}
