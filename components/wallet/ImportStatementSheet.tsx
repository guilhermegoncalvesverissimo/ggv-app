"use client";

import { useMemo, useRef, useState } from "react";
import { Check, FileUp } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { categoriesFor, categoryById } from "@/lib/wallet/categories";
import { formatCents } from "@/lib/wallet/format";
import { parseStatement, selectedByDefault, type StatementRow } from "@/lib/wallet/statement";
import type { Account, Transaction, WalletEvent } from "@/lib/wallet/types";
import { cn } from "@/lib/utils";

/** Statement rows can be in other currencies (USD on a trip, …). */
function money(cents: number, currency: string): string {
  if (!currency || currency === "EUR") return formatCents(cents, { signed: true });
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency, signDisplay: "always" }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

type Row = StatementRow & { selected: boolean; duplicate: boolean };

/**
 * Import a Revolut statement CSV: preview every row, tick what to bring in
 * (card payments pre-ticked), adjust categories, then create the
 * transactions. Rows that already exist in the Wallet are flagged.
 */
export function ImportStatementSheet({
  open,
  onClose,
  accounts,
  transactions,
  events = [],
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  events?: WalletEvent[];
  onAdd: (tx: Omit<Transaction, "id" | "createdAt">) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const defaultAccount =
    accounts.find((a) => /revolut/i.test(a.name))?.id ?? accounts[0]?.id ?? "";
  const [accountId, setAccountId] = useState(defaultAccount);
  const [eventId, setEventId] = useState<string | null>(null);
  const account = accountId || defaultAccount;

  const reset = () => {
    setRows(null);
    setError(null);
    setDone(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const parsed = isPdf
        ? await (await import("@/lib/wallet/statementPdf")).parseRevolutPdf(await file.arrayBuffer())
        : parseStatement(await file.text());
      if (parsed.length === 0) throw new Error("Não encontrei movimentos neste ficheiro.");
      // Same day + amount + direction already in the Wallet → probably the
      // Apple Pay shortcut (or an earlier import) got it already.
      const seen = new Set(
        transactions.map((t) => `${t.date}|${t.amountCents}|${t.type}`)
      );
      setRows(
        parsed
          .map((r) => {
            const duplicate = seen.has(
              `${r.date}|${Math.abs(r.amountCents)}|${r.amountCents < 0 ? "expense" : "income"}`
            );
            return { ...r, duplicate, selected: selectedByDefault(r) && !duplicate };
          })
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o ficheiro.");
    }
  };

  const selected = useMemo(() => rows?.filter((r) => r.selected) ?? [], [rows]);
  const total = selected.reduce((s, r) => s + r.amountCents, 0);

  const importNow = () => {
    if (!account) return;
    for (const r of selected) {
      onAdd({
        accountId: account,
        type: r.amountCents < 0 ? "expense" : "income",
        amountCents: Math.abs(r.amountCents),
        category: r.category,
        note: r.description,
        date: r.date,
        eventId: eventId ?? undefined,
      });
    }
    setDone(selected.length);
    setRows(null);
  };

  const update = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);

  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
    >
      <div className="-mx-1 max-h-[80dvh] space-y-4 overflow-y-auto px-1 pb-1">
        <div className="px-1">
          <h2 className="text-lg font-semibold tracking-tight">Importar extrato</h2>
          {!rows && (
            <p className="mt-1 text-sm text-muted">
              No Revolut: <b className="text-ink">Conta → ⋯ → Extrato</b>, escolhe o
              período (ex.: novembro) e guarda o PDF (ou o Excel/CSV). Depois escolhe-o
              aqui. Vês tudo antes de importar.
            </p>
          )}
        </div>

        {done !== null && (
          <div className="rounded-2xl bg-success/10 p-4 text-sm text-ink">
            {done === 0
              ? "Nada importado."
              : `${done} ${done === 1 ? "movimento importado" : "movimentos importados"}. Já aparecem em Despesas e Transações.`}
          </div>
        )}
        {error && <p className="px-1 text-sm text-danger">{error}</p>}

        {!rows && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-card-border px-4 py-6 text-sm font-medium text-ink transition active:scale-[0.99]"
          >
            <FileUp className="h-5 w-5" /> Escolher extrato (PDF ou CSV)
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,.csv,text/csv,text/comma-separated-values,application/vnd.ms-excel"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {rows && (
          <>
            {accounts.length > 1 && (
              <div>
                <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Para a conta
                </p>
                <div className="flex flex-wrap gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAccountId(a.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition",
                        account === a.id ? "bg-elevated text-white" : "bg-canvas-soft/50 text-ink"
                      )}
                    >
                      {a.emoji ? `${a.emoji} ` : ""}
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div>
                <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Juntar a um evento (opcional)
                </p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {[{ id: null, name: "Nenhum" }, ...events].map((e) => (
                    <button
                      key={e.id ?? "none"}
                      type="button"
                      onClick={() => setEventId(e.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
                        eventId === e.id ? "bg-elevated text-white" : "bg-canvas-soft/50 text-ink"
                      )}
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-1 text-xs text-muted">
              <span>
                {rows.length} movimentos · {selected.length} selecionados
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  className="font-medium text-ink"
                  onClick={() => setRows((p) => p?.map((r) => ({ ...r, selected: !r.duplicate })) ?? null)}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className="font-medium text-ink"
                  onClick={() => setRows((p) => p?.map((r) => ({ ...r, selected: false })) ?? null)}
                >
                  Nenhum
                </button>
              </span>
            </div>

            <ul className="divide-y divide-card-border rounded-3xl border border-card-border">
              {rows.map((r) => {
                const isExpense = r.amountCents < 0;
                const cats = categoriesFor(isExpense ? "expense" : "income");
                return (
                  <li key={r.key} className={cn("flex items-start gap-3 p-3", !r.selected && "opacity-60")}>
                    <button
                      type="button"
                      aria-label={r.selected ? "Não importar" : "Importar"}
                      onClick={() => update(r.key, { selected: !r.selected })}
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                        r.selected ? "border-elevated bg-elevated text-white" : "border-card-border"
                      )}
                    >
                      {r.selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{r.description}</p>
                        <span
                          className={cn(
                            "shrink-0 text-sm tabular-nums",
                            isExpense ? "text-ink" : "text-success"
                          )}
                        >
                          {money(r.amountCents, r.currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                        <span>{r.date.split("-").reverse().slice(0, 2).join("/")}</span>
                        <select
                          value={r.category}
                          onChange={(e) => update(r.key, { category: e.target.value })}
                          className="rounded-full bg-canvas-soft/60 px-2 py-0.5 text-xs text-ink outline-none"
                        >
                          {cats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.emoji} {c.label}
                            </option>
                          ))}
                          {!categoryById(r.category) && <option value={r.category}>{r.category}</option>}
                        </select>
                        {r.duplicate && <span className="text-danger">já registado</span>}
                        {!r.completed && <span>pendente</span>}
                        {r.kind && r.kind !== "CARD_PAYMENT" && (
                          <span className="lowercase">{r.kind.replace(/_/g, " ")}</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="sticky bottom-0 flex gap-2 bg-card-bg pt-1">
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-full bg-canvas-soft/50 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
              >
                Outro ficheiro
              </button>
              <button
                type="button"
                disabled={selected.length === 0 || !account}
                onClick={importNow}
                className="flex-[1.4] rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
              >
                Importar {selected.length} · {formatCents(total, { signed: true })}
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
