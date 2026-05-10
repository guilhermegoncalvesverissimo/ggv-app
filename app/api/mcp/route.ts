import { NextResponse } from "next/server";
import { checkBearer } from "@/lib/news/auth";
import { addPost } from "@/lib/news/store";
import { StorageNotConfiguredError } from "@/lib/news/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
  {
    name: "save_news_post",
    description:
      "Save a news post (e.g. an X/Twitter post by Boris Cherny) into GGV's Notícias feed, with a Portuguese translation. The combination of `source` and `postedAt` is treated as the unique key — calling this with the same source URL again will update the existing entry rather than create a duplicate.",
    inputSchema: {
      type: "object",
      required: ["source", "originalText", "translation", "postedAt"],
      properties: {
        source: {
          type: "string",
          description:
            "URL of the original post — e.g. https://x.com/bcherny/status/123…",
        },
        author: {
          type: "string",
          description: "Author handle, e.g. \"@bcherny\". Optional.",
        },
        originalText: {
          type: "string",
          description: "Original post text, untranslated.",
        },
        translation: {
          type: "string",
          description:
            "Translation into European Portuguese (pt-PT). Keep technical/product terms accurate.",
        },
        postedAt: {
          type: "string",
          description: "When the original was posted, ISO 8601.",
          format: "date-time",
        },
      },
    },
  },
];

type RpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: RpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}

function rpcError(
  id: RpcRequest["id"],
  code: number,
  message: string,
  status = 200
) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status }
  );
}

/**
 * MCP custom-connector endpoint. Implements the JSON-RPC subset that
 * claude.ai's custom connector calls during a session: `initialize`,
 * `tools/list`, `tools/call`, plus the `notifications/initialized` ack.
 *
 * Auth: every request must carry `Authorization: Bearer <MCP_BEARER_TOKEN>`.
 */
export async function POST(req: Request) {
  if (!checkBearer(req)) {
    return rpcError(null, -32001, "Unauthorized", 401);
  }

  let body: RpcRequest;
  try {
    body = (await req.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  const { method, id, params } = body;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ggv-news", version: "1.0.0" },
      });

    case "notifications/initialized":
      // Notifications don't expect a response.
      return new NextResponse(null, { status: 204 });

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call":
      return await handleToolCall(id, params);

    case "ping":
      return rpcResult(id, {});

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function handleToolCall(
  id: RpcRequest["id"],
  params: Record<string, unknown> | undefined
) {
  const name = params?.name as string | undefined;
  const args = (params?.arguments ?? {}) as Record<string, unknown>;

  if (name !== "save_news_post") {
    return rpcError(id, -32602, `Unknown tool: ${name ?? "<unset>"}`);
  }

  const required = ["source", "originalText", "translation", "postedAt"] as const;
  for (const f of required) {
    if (typeof args[f] !== "string" || !(args[f] as string).trim()) {
      return rpcResult(id, {
        isError: true,
        content: [
          {
            type: "text",
            text: `Missing or invalid field: ${f}`,
          },
        ],
      });
    }
  }

  try {
    const post = await addPost({
      source: args.source as string,
      author: typeof args.author === "string" ? args.author : undefined,
      originalText: args.originalText as string,
      translation: args.translation as string,
      postedAt: args.postedAt as string,
    });
    return rpcResult(id, {
      content: [
        {
          type: "text",
          text: `Saved news post ${post.id} (source: ${post.source}).`,
        },
      ],
    });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) {
      return rpcResult(id, {
        isError: true,
        content: [
          {
            type: "text",
            text:
              "Storage not configured. The GGV admin needs to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the Vercel project.",
          },
        ],
      });
    }
    return rpcResult(id, {
      isError: true,
      content: [
        { type: "text", text: (e as Error).message ?? "Unknown error" },
      ],
    });
  }
}

/** GET is not part of the connector protocol (we use the POST request/response
 *  flavour of Streamable HTTP). Return a small JSON description so a curl
 *  works as a sanity check. */
export async function GET() {
  return NextResponse.json({
    name: "ggv-news",
    version: "1.0.0",
    protocolVersion: PROTOCOL_VERSION,
    transport: "streamable-http (request/response)",
    tools: TOOLS.map((t) => t.name),
    note:
      "POST JSON-RPC 2.0 with Authorization: Bearer <token>. Methods: initialize, tools/list, tools/call.",
  });
}
