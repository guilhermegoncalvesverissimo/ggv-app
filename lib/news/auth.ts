import type { NextRequest } from "next/server";

/**
 * Bearer-token check against `MCP_BEARER_TOKEN`. Returns false if no token is
 * configured or if the request doesn't carry it — never `true` by default.
 */
export function checkBearer(req: NextRequest | Request): boolean {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected) return false;
  const got = req.headers.get("authorization") ?? "";
  if (!got.startsWith("Bearer ")) return false;
  const provided = got.slice("Bearer ".length).trim();
  // Constant-time comparison to avoid timing attacks.
  return constantTimeEqual(provided, expected);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
