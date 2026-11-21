import { guessCategory, parseAmount } from "./merchant";
import type { StatementRow } from "./statement";

/**
 * Revolut PDF statement (Portuguese). Each operation starts with a line
 *   dd/mm/yyyy  dd/mm/yyyy  <description>  <amount>€  <balance>€
 * followed by detail lines ("Para: …", "De: …", "Cartão: …", "Referência:
 * …"), and long descriptions wrap onto them too.
 *
 * Out vs in: the amount sits under "Dinheiro retirado" or "Dinheiro
 * recebido", but the columns drift (a long description pushes it left), so
 * we decide from the running balance instead — previous balance − amount =
 * this balance means money out.
 */

type TextItem = { str: string; transform: number[]; width?: number };

/** Rebuilds visual lines from pdf.js text items (same y → same line). */
export async function pdfToLines(data: ArrayBuffer): Promise<string[]> {
  // Legacy build: works on older iOS Safari too (the modern one needs
  // Promise.try), and in Node for tests.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as TextItem[]) {
      if (!("str" in it) || !it.str.trim()) continue;
      const y = Math.round(it.transform[5]);
      // Items a pixel or two apart vertically belong to the same line.
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      rows.set(key, [...(rows.get(key) ?? []), { x: it.transform[4], s: it.str }]);
    }
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      lines.push(
        rows
          .get(y)!
          .sort((a, b) => a.x - b.x)
          .map((i) => i.s.trim())
          .join("  ")
      );
    }
  }
  return lines;
}

const MONEY = String.raw`\d{1,3}(?:[ .\u00a0\u202f]\d{3})*,\d{2}\s?€`;
const START = new RegExp(
  String.raw`^(\d{2})/(\d{2})/(\d{4})\s+\d{2}/\d{2}/\d{4}\s+(.*?)\s*(${MONEY})\s+(${MONEY})\s*$`
);
const ONLY_DATES = /^(\d{2})\/(\d{2})\/(\d{4})\s+\d{2}\/\d{2}\/\d{4}\s+(.*)$/;
const OPENING = new RegExp(String.raw`^Conta\b.*?(${MONEY})\s+${MONEY}\s+${MONEY}\s+${MONEY}`);
// Lines that are page furniture, not part of an operation.
const NOISE =
  /^(Data|Lançamento|Data-Valor|Saldo|contabilístico|Comunicar perda|Obter ajuda|Leia o código|©|Extrato de|Gerado a|Revolut Bank|Fábrica 390|\+351|Operações da conta|Página \d)/i;

const cents = (m: string) => parseAmount(m) ?? 0;

type Draft = {
  date: string;
  title: string;
  amount: number;
  balance: number;
  details: string[];
};

export function parseRevolutPdfLines(lines: string[]): StatementRow[] {
  let opening: number | null = null;
  const drafts: Draft[] = [];
  let cur: Draft | null = null;
  let inOps = false;

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    if (opening === null) {
      const o = line.match(OPENING);
      if (o) opening = cents(o[1]);
    }
    if (/^Operações da conta/i.test(line)) inOps = true;
    if (!inOps) continue;
    // Footer text sits in the left column and would glue onto the last
    // operation of each page.
    if (/^(Comunicar perda|©)/i.test(line)) {
      cur = null;
      continue;
    }

    const m = line.match(START);
    if (m) {
      cur = {
        date: `${m[3]}-${m[2]}-${m[1]}`,
        title: m[4].trim(),
        amount: cents(m[5]),
        balance: cents(m[6]),
        details: [],
      };
      drafts.push(cur);
      continue;
    }
    if (ONLY_DATES.test(line)) continue; // malformed start: skip safely
    if (cur && !NOISE.test(line)) {
      // "Para: …", "De: …", "Cartão: …" start a detail; anything else is the
      // previous detail (or the title) wrapping onto the next line.
      if (/^[A-Za-zÀ-ÿ-]+:\s/.test(line) || cur.details.length === 0) cur.details.push(line);
      else cur.details[cur.details.length - 1] += ` ${line}`;
    }
  }

  if (drafts.length === 0) {
    throw new Error("Não encontrei operações neste PDF. É o extrato da conta do Revolut?");
  }

  let prev = opening;
  return drafts.map((d, i) => {
    let out: boolean;
    if (prev !== null && Math.abs(prev - d.amount - d.balance) <= 1) out = true;
    else if (prev !== null && Math.abs(prev + d.amount - d.balance) <= 1) out = false;
    else out = !/^(transferência .* de|.*\bde:)/i.test(d.title); // fallback
    prev = d.balance;

    const detail = (k: string) =>
      d.details.find((x) => x.toLowerCase().startsWith(k))?.slice(k.length).trim();
    const isCard = d.details.some((x) => /^cartão:/i.test(x));
    const para = detail("para:");
    const de = detail("de:");

    let description = d.title;
    let kind = isCard ? "CARD_PAYMENT" : "TRANSFER";
    if (/^mbway/i.test(d.title)) {
      kind = "MBWAY";
      description = `MB WAY · ${(out ? para : de)?.replace(/,\s*$/, "") ?? ""}`.trim();
    } else if (/^transferência/i.test(d.title)) {
      const who = (out ? para : de) ?? d.title;
      description = `Transferência · ${who}`;
    } else if (/^carregamento|^top.?up/i.test(d.title)) {
      kind = "TOPUP";
    } else if (isCard && para) {
      // "Restaurante" + "Para: Restaurante O, Toucinhos" → use the fuller name.
      const name = para.split(",")[0].trim();
      if (name.length > d.title.length) description = name;
    }
    const amountCents = out ? -d.amount : d.amount;
    return {
      key: String(i),
      date: d.date,
      description,
      amountCents,
      currency: "EUR",
      kind,
      completed: true,
      category: out ? guessCategory(`${d.title} ${para ?? ""}`) : "other-income",
    };
  });
}

export async function parseRevolutPdf(data: ArrayBuffer): Promise<StatementRow[]> {
  return parseRevolutPdfLines(await pdfToLines(data));
}
