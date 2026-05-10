import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Single-user session cookie, signed with HMAC-SHA256 using `APP_SECRET`.
 *
 * The value is `<base64url-payload>.<base64url-signature>`. Verification is
 * constant-time. There's only ever one valid "user" so the payload is just
 * `{exp: <unix-ms>}` — no user id needed.
 */

export const SESSION_COOKIE = "ggv_session";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionPayload = { exp: number };

function b64urlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s) {
    throw new Error(
      "APP_SECRET is not set. Generate one with `openssl rand -hex 32` and add it to the Vercel env."
    );
  }
  return s;
}

export function signSession(ttlMs: number = DEFAULT_TTL_MS): string {
  const payload: SessionPayload = { exp: Date.now() + ttlMs };
  const json = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(json);
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let providedSig: Buffer;
  try {
    providedSig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expectedSig = createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest();

  if (
    providedSig.length !== expectedSig.length ||
    !timingSafeEqual(providedSig, expectedSig)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(b64urlDecode(payloadB64).toString()) as
      | SessionPayload
      | null;
    if (!payload || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Standard cookie options for setting the session via Set-Cookie. */
export function sessionCookieOptions(): {
  name: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
} {
  return {
    name: SESSION_COOKIE,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DEFAULT_TTL_MS / 1000,
    },
  };
}
