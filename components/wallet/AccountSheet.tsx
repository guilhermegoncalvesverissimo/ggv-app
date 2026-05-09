"use client";

import { useEffect, useState } from "react";
import { Plus, Check, ChevronLeft } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ACCOUNT_COLORS, DEFAULT_ACCOUNT_COLOR } from "@/lib/wallet/colors";
import type { Account } from "@/lib/wallet/types";

type Selected = string | "all";

export function AccountSheet({
  open,
  onClose,
  accounts,
  selected,
  onSelect,
  onAdd,
  /** Whether to show the "Todas as contas" entry at the top of the list. */
  withAllOption = true,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  selected: Selected;
  onSelect: (id: Selected) => void;
  onAdd: (input: { name: string; color: string; emoji?: string }) => void;
  withAllOption?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_ACCOUNT_COLOR);

  useEffect(() => {
    if (!open) {
      setAdding(false);
      setName("");
      setEmoji("");
      setColor(DEFAULT_ACCOUNT_COLOR);
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name, color, emoji });
    setAdding(false);
    setName("");
    setEmoji("");
    setColor(DEFAULT_ACCOUNT_COLOR);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {adding ? (
        <>
          <div className="flex items-center pb-1">
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Voltar"
              className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">Nova conta</h2>
          </div>

          <form
            className="space-y-3 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Nome
              </span>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Agiliz, Petcity, Pessoal"
                autoCapitalize="words"
                className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Emoji (opcional)
              </span>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                placeholder="Ex.: 💼 ou 🐾"
                className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-accent"
              />
            </label>

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
                    className={`relative h-9 w-9 rounded-full transition active:scale-95 ${
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

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
              >
                Criar conta
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
            Contas
          </h2>

          <ul className="space-y-1.5 pt-2">
            {withAllOption && (
              <AccountRow
                label="Todas as contas"
                color="#0e0e10"
                emoji="∑"
                active={selected === "all"}
                onSelect={() => {
                  onSelect("all");
                  onClose();
                }}
              />
            )}
            {accounts.map((a) => (
              <AccountRow
                key={a.id}
                label={a.name}
                color={a.color}
                emoji={a.emoji}
                active={selected === a.id}
                onSelect={() => {
                  onSelect(a.id);
                  onClose();
                }}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Nova conta
          </button>
        </>
      )}
    </Sheet>
  );
}

function AccountRow({
  label,
  color,
  emoji,
  active,
  onSelect,
}: {
  label: string;
  color: string;
  emoji?: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
          active ? "bg-canvas-soft/60" : "bg-canvas-soft/30"
        }`}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: color }}
        >
          {emoji ?? label[0]?.toUpperCase()}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-ink">
          {label}
        </span>
        {active && <Check className="h-4 w-4 text-accent" />}
      </button>
    </li>
  );
}
