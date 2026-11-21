"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents } from "@/lib/wallet/format";
import type { Transaction, WalletEvent } from "@/lib/wallet/types";
import { cn } from "@/lib/utils";

/**
 * Tick which transactions belong to an event. With event dates, the list
 * starts on those days ("Datas do evento"); "Todos" shows everything.
 */
export function AssignEventSheet({
  open,
  onClose,
  event,
  events,
  transactions,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  event: WalletEvent;
  events: WalletEvent[];
  transactions: Transaction[];
  onSave: (change: { add: string[]; remove: string[] }) => void;
}) {
  const hasDates = !!event.startDate;
  const [scope, setScope] = useState<"dates" | "all">(hasDates ? "dates" : "all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Start from the current membership every time the sheet opens.
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setPicked(new Set(transactions.filter((t) => t.eventId === event.id).map((t) => t.id)));
      setScope(hasDates ? "dates" : "all");
      setQuery("");
    }
  }

  const eventName = useMemo(() => new Map(events.map((e) => [e.id, e.name])), [events]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A day either side: card payments often settle a day late.
    const pad = (iso: string, days: number) => {
      const [y, m, d] = iso.split("-").map(Number);
      const dt = new Date(y, m - 1, d + days);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    };
    const from = event.startDate ? pad(event.startDate, -1) : "";
    const to = event.startDate ? pad(event.endDate ?? event.startDate, 1) : "";
    return transactions
      .filter((t) => !t.id.startsWith("temp_"))
      .filter((t) => scope === "all" || picked.has(t.id) || (t.date >= from && t.date <= to))
      .filter((t) => {
        if (!q) return true;
        const cat = categoryById(t.category)?.label ?? "";
        return `${t.note ?? ""} ${cat}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
      .slice(0, 300);
  }, [transactions, scope, query, picked, event.startDate, event.endDate]);

  const before = useMemo(
    () => new Set(transactions.filter((t) => t.eventId === event.id).map((t) => t.id)),
    [transactions, event.id]
  );
  const add = [...picked].filter((id) => !before.has(id));
  const remove = [...before].filter((id) => !picked.has(id));
  const total = transactions
    .filter((t) => picked.has(t.id))
    .reduce((s, t) => s + (t.type === "expense" ? t.amountCents : -t.amountCents), 0);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-3">
        <h2 className="px-1 text-lg font-semibold tracking-tight">Movimentos do evento</h2>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar"
              className="w-full rounded-full bg-canvas-soft/40 py-2.5 pl-9 pr-3 text-base text-ink outline-none ring-2 ring-transparent focus:bg-card-bg focus:ring-accent"
            />
          </div>
          {hasDates && (
            <div className="flex shrink-0 rounded-full bg-canvas-soft/60 p-1 text-xs font-medium">
              {(["dates", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={cn("rounded-full px-2.5 py-1.5", scope === s ? "bg-elevated text-white" : "text-muted")}
                >
                  {s === "dates" ? "Datas" : "Todos"}
                </button>
              ))}
            </div>
          )}
        </div>

        <ul className="-mx-1 max-h-[52dvh] divide-y divide-card-border overflow-y-auto px-1">
          {list.length === 0 && (
            <li className="py-6 text-center text-sm text-muted">
              {scope === "dates" ? "Nada nessas datas. Experimenta “Todos”." : "Sem movimentos."}
            </li>
          )}
          {list.map((t) => {
            const on = picked.has(t.id);
            const other = t.eventId && t.eventId !== event.id ? eventName.get(t.eventId) : null;
            const cat = categoryById(t.category);
            return (
              <li key={t.id}>
                <button type="button" onClick={() => toggle(t.id)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                      on ? "border-elevated bg-elevated text-white" : "border-card-border"
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {t.note || cat?.label || "Sem nota"}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {t.date.split("-").reverse().slice(0, 2).join("/")} · {cat ? `${cat.emoji} ${cat.label}` : t.category}
                      {other && !on ? ` · em “${other}”` : ""}
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-sm tabular-nums", t.type === "income" ? "text-success" : "text-ink")}>
                    {formatCents(t.type === "expense" ? -t.amountCents : t.amountCents, { signed: true })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (add.length || remove.length) onSave({ add, remove });
              onClose();
            }}
            className="flex-[1.4] rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
          >
            Guardar · {picked.size} · {formatCents(total)}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
