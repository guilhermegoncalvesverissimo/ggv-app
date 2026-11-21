import { guessCategory, parseAmount } from "./merchant";

/**
 * Parses a bank statement CSV — built for Revolut's export (Type, Product,
 * Started Date, Completed Date, Description, Amount, Fee, Currency, State,
 * Balance), but finds columns by name (English or Portuguese), so similar
 * exports work too.
 */

export type StatementRow = {
  key: string;
  date: string; // YYYY-MM-DD
  description: string;
  /** Signed: negative = money out. Includes the fee. */
  amountCents: number;
  currency: string;
  kind: string; // CARD_PAYMENT, TRANSFER, TOPUP, …
  completed: boolean;
  category: string;
};

/** RFC 4180-ish: quoted fields, escaped quotes, , or ; separators. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) rows.push(row);
  return rows;
}

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function findCol(headers: string[], names: string[]): number {
  const h = headers.map(norm);
  for (const n of names) {
    const i = h.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

function toIsoDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/); // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export function parseStatement(text: string): StatementRow[] {
  const [headers, ...rows] = parseCsv(text);
  if (!headers) throw new Error("O ficheiro está vazio.");
  const col = {
    type: findCol(headers, ["type", "tipo"]),
    started: findCol(headers, ["started date", "data de inicio", "data inicio"]),
    completed: findCol(headers, ["completed date", "data de conclusao", "data conclusao", "date", "data"]),
    description: findCol(headers, ["description", "descricao"]),
    amount: findCol(headers, ["amount", "montante", "valor", "quantia"]),
    fee: findCol(headers, ["fee", "taxa", "comissao"]),
    currency: findCol(headers, ["currency", "moeda"]),
    state: findCol(headers, ["state", "estado"]),
  };
  if (col.amount < 0 || (col.started < 0 && col.completed < 0) || col.description < 0) {
    throw new Error(
      "Não reconheço este ficheiro. Usa o extrato do Revolut em formato CSV (Excel não serve)."
    );
  }

  const out: StatementRow[] = [];
  rows.forEach((r, i) => {
    const date = toIsoDate(r[col.started >= 0 ? col.started : col.completed] ?? "");
    const amount = parseAmount(r[col.amount] ?? "");
    if (!date || amount === null || amount === 0) return;
    // Revolut lists the fee apart, as a positive number charged on top.
    const fee = col.fee >= 0 ? Math.abs(parseAmount(r[col.fee] ?? "") ?? 0) : 0;
    const amountCents = amount < 0 ? amount - fee : amount;
    const description = (r[col.description] ?? "").trim() || "Sem descrição";
    const state = col.state >= 0 ? norm(r[col.state] ?? "") : "completed";
    out.push({
      key: `${i}`,
      date,
      description,
      amountCents,
      currency: col.currency >= 0 ? (r[col.currency] ?? "").trim().toUpperCase() : "EUR",
      kind: col.type >= 0 ? (r[col.type] ?? "").trim().toUpperCase() : "",
      completed: state === "completed" || state === "concluida" || state === "concluido",
      category: amountCents < 0 ? guessCategory(description) : "other-income",
    });
  });
  return out;
}

/** What we pre-tick: completed card payments and MB WAY payments in euros.
 *  Bank transfers, top-ups, exchanges and pending rows show up unticked, to
 *  opt into by hand. */
export function selectedByDefault(r: StatementRow): boolean {
  return (
    r.amountCents < 0 &&
    r.completed &&
    (r.currency === "" || r.currency === "EUR") &&
    (r.kind === "" || r.kind === "CARD_PAYMENT" || r.kind === "ATM" || r.kind === "MBWAY")
  );
}
