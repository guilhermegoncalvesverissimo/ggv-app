import { createHmac, timingSafeEqual } from "node:crypto";

export { guessCategory, parseAmount } from "./merchant";

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

/** Today's date in Portugal, as YYYY-MM-DD. */
export function todayLisbon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(new Date());
}
