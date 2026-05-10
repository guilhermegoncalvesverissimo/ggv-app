import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * Auth gate. Runs in Node.js runtime (Next.js 16's proxy.ts equivalent of
 * the old middleware.ts). Excluded paths via the matcher are public:
 *
 *   - `/login` and the login form
 *   - `/api/auth/*` (login / logout)
 *   - `/api/news` and `/api/mcp` (used by the daily routine — own bearer auth)
 *   - `/.well-known/*` (oauth-protected-resource metadata)
 *   - Next.js internals + static assets
 *
 * Everything else (pages + protected API routes) requires a valid session.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (verifySession(token)) {
    return NextResponse.next();
  }

  // Protected API → 401 JSON.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected page → redirect to /login?next=<original>.
  const url = request.nextUrl.clone();
  const next = url.pathname + url.search;
  url.pathname = "/login";
  url.search = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /**
     * Match everything except the public paths. Inside the negative lookahead:
     *
     *   api/news       — public news REST (routine + Notícias fetch)
     *   api/mcp        — public MCP server (claude.ai connector)
     *   api/auth       — login / logout
     *   _next/static   — Next.js static chunks
     *   _next/image    — Next.js optimized images
     *   favicon\.ico   — old favicon (in case)
     *   icon\.svg      — our SVG icon
     *   apple-icon     — apple touch icon
     *   manifest\.json — PWA manifest
     *   login          — the login page itself
     *   \.well-known   — RFC 9728 metadata
     */
    "/((?!api/news|api/mcp|api/auth|_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon|manifest\\.json|login|\\.well-known).*)",
  ],
};
