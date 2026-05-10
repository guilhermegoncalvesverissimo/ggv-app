"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function TagsInput({
  value,
  onChange,
  placeholder = "Adicionar tag",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const t = draft.trim().replace(/^#+/, "");
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="mt-1 rounded-2xl bg-canvas-soft/40 px-3 py-2 ring-2 ring-transparent transition focus-within:bg-white focus-within:ring-accent">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-elevated/90 px-2 py-1 text-xs font-medium text-white"
          >
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remover ${t}`}
              className="-mr-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === " ") {
              e.preventDefault();
              commit();
            } else if (
              e.key === "Backspace" &&
              draft === "" &&
              value.length > 0
            ) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ""}
          autoCapitalize="none"
          autoComplete="off"
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-muted-soft"
        />
      </div>
    </div>
  );
}
