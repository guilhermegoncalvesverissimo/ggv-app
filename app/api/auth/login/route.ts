import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expectedRaw = process.env.APP_PASSWORD;
  if (!expectedRaw) {
    return NextResponse.json(
      { error: "Server is not configured (APP_PASSWORD missing)" },
      { status: 503 }
    );
  }
  // Trim both sides defensively — iOS paste, Vercel env quirks, etc. can
  // introduce trailing whitespace that turns a correct password into a 401.
  const expected = expectedRaw.trim();
  const provided = (body.password ?? "").trim();

  // Pad to equal lengths for constant-time compare.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const maxLen = Math.max(a.length, b.length);
  const aPadded = Buffer.concat([a, Buffer.alloc(maxLen - a.length)]);
  const bPadded = Buffer.concat([b, Buffer.alloc(maxLen - b.length)]);
  const match = a.length === b.length && timingSafeEqual(aPadded, bPadded);

  if (!match) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = signSession();
  const { name, options } = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, token, options);
  return res;
}

export async function GET() {
  // Useful for the login page to check whether the session cookie is still valid.
  return NextResponse.json({ method: "POST { password } to log in" });
}

// Helper for the logout route to clear the cookie consistently.
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions().options,
    maxAge: 0,
  });
  return res;
}
