import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * RFC 9728 protected-resource metadata.
 *
 * Lets MCP clients (e.g. claude.ai's custom connector dialog) discover that
 * this resource accepts bearer authentication. We don't run an OAuth server,
 * so `authorization_servers` is empty — clients should fall back to a static
 * bearer token configured in their UI.
 */
export async function GET() {
  return NextResponse.json(
    {
      resource: "https://ggv-app.vercel.app/api/mcp",
      authorization_servers: [],
      scopes_supported: [],
      bearer_methods_supported: ["header"],
      resource_documentation: "https://github.com/guilhermegoncalvesverissimo/ggv-app",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
