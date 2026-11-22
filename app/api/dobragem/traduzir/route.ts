import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Translates subtitle lines English → European Portuguese.
 *
 * Free by default (Google Translate's public web endpoint, no key). If
 * ANTHROPIC_API_KEY is set in Vercel, Claude does it instead: better, in
 * pt-PT, and aware of the surrounding lines — at a cost of cents per video.
 */

const SYSTEM =
  "You translate video subtitle lines from English to European Portuguese (português de Portugal, not Brazilian). " +
  "The lines will be read aloud as a voice-over, so write natural spoken Portuguese, keep each line about as long as the original, " +
  "and use the neighbouring lines for context. Return exactly one translated line per input line, in the same order.";

async function withClaude(lines: string[]): Promise<string[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: { lines: { type: "array", items: { type: "string" } } },
          required: ["lines"],
          additionalProperties: false,
        },
      },
    },
    system: SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(lines) }],
  });
  if (response.stop_reason === "refusal") throw new Error("Tradução recusada");
  const text = response.content.find((b) => b.type === "text");
  const parsed = JSON.parse(text && text.type === "text" ? text.text : "{}") as { lines?: string[] };
  if (!parsed.lines || parsed.lines.length !== lines.length) throw new Error("Tradução incompleta");
  return parsed.lines;
}

async function gtx(text: string): Promise<string> {
  const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-PT&dt=t", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ q: text }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as [[string, string][]];
  return j[0].map((p) => p[0]).join("");
}

async function withGoogle(lines: string[]): Promise<string[]> {
  // One request for the whole batch; line breaks survive translation.
  const joined = await gtx(lines.join("\n"));
  const split = joined.split("\n").map((s) => s.trim());
  if (split.length === lines.length) return split;
  // Lines got merged somewhere: fall back to one request per line.
  return Promise.all(lines.map((l) => gtx(l).catch(() => l)));
}

export async function POST(req: Request) {
  let body: { lines?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const lines = Array.isArray(body.lines) ? body.lines.map((l) => String(l ?? "")).slice(0, 200) : [];
  if (lines.length === 0) return NextResponse.json({ lines: [] });

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return NextResponse.json({ lines: await withClaude(lines), engine: "claude" });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) console.error("ANTHROPIC_API_KEY inválida");
      // fall through to the free engine
    }
  }
  try {
    return NextResponse.json({ lines: await withGoogle(lines), engine: "google" });
  } catch {
    return NextResponse.json({ error: "O serviço de tradução não respondeu. Tenta daqui a pouco." }, { status: 502 });
  }
}
