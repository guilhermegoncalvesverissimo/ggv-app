import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Apple Pay → Wallet, via an iOS Shortcuts "Transaction" automation that
 * POSTs each payment to /api/hooks/apple-pay. Server-only.
 */

/**
 * The Shortcut's bearer token. Derived from APP_SECRET, so there's nothing
 * to store or configure: the app shows it, the Shortcut sends it back.
 * Rotating APP_SECRET revokes it (and logs every session out).
 */
export function applePayToken(): string | null {
  const secret = process.env.APP_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("wallet:apple-pay:v1").digest("base64url");
}

export function checkApplePayToken(header: string | null): boolean {
  const expected = applePayToken();
  const given = header?.replace(/^Bearer\s+/i, "").trim();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Shortcuts hands the amount over as localised text — "€4,50", "4,50 €",
 * "1.234,56 €", "$1,234.56", "-12,00 €" — or sometimes a bare number.
 * Returns signed cents, or null when there's no number in it.
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw * 100) : null;
  if (typeof raw !== "string") return null;
  const negative = /[-−]/.test(raw);
  let s = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  const decimalSep =
    lastComma > lastDot
      ? s.length - lastComma - 1 <= 2 ? "," : null
      : lastDot > lastComma
        ? s.length - lastDot - 1 <= 2 ? "." : null
        : null;
  if (decimalSep) {
    const i = s.lastIndexOf(decimalSep);
    s = s.slice(0, i).replace(/[.,]/g, "") + "." + s.slice(i + 1);
  } else {
    s = s.replace(/[.,]/g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return negative ? -cents : cents;
}

const RULES: [RegExp, string][] = [
  [/uber\s*eats|glovo|bolt\s*food|too\s*good|restaur|caf[eé]|pastelaria|padaria|burger|mcdonald|kfc|pizza|telepizza|starbucks|sushi|taberna|tasca|snack/i, "food"],
  [/pingo\s*doce|continente|lidl|aldi|mercadona|intermarch|minipre[cç]o|auchan|el\s*corte|supermerc|meu\s*super|spar\b|amanhecer/i, "food"],
  [/\buber\b|bolt|free\s*now|cabify|galp|repsol|\bbp\b|cepsa|prio|via\s*verde|\bcp\b|comboios|metro|carris|fertagus|\bstcp\b|parque|parking|emel|easypark|ryanair|tap\b|easyjet|flixbus|rede\s*expressos/i, "transport"],
  [/netflix|spotify|disney|hbo|max\.com|prime\s*video|youtube|apple\.com|icloud|google\s*(one|storage)|chatgpt|openai|anthropic|claude|patreon|adobe|microsoft|dropbox|notion/i, "subscriptions"],
  [/farm[aá]cia|wells|cl[ií]nica|hospital|dentist|cuf\b|luz\s*sa[uú]de|lusíadas|lusiadas|[oó]tica|ginásio|ginasio|holmes|fitness|solinca/i, "health"],
  [/cinema|nos\s*cinemas|cinemas|ticketline|blueticket|teatro|museu|concerto|steam|playstation|xbox|nintendo|bowling|bar\b|discoteca/i, "leisure"],
  [/edp|endesa|goldenergy|[aá]guas|epal|meo\b|nos\b|vodafone|digi\b|nowo/i, "bills"],
  [/ikea|leroy|aki\b|maxmat|conforama|jysk/i, "home"],
  [/amazon|zara|h&m|primark|fnac|worten|decathlon|pull\s*&?\s*bear|bershka|mango|sport\s*zone|radio\s*popular|shein|temu|aliexpress|apple\s*store|el\s*corte/i, "shopping"],
  [/udemy|coursera|livraria|bertrand|wook|escola|universidade|propina/i, "education"],
];

export function guessCategory(merchant: string): string {
  for (const [re, cat] of RULES) if (re.test(merchant)) return cat;
  return "other-expense";
}

/** Today's date in Portugal, as YYYY-MM-DD. */
export function todayLisbon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}
