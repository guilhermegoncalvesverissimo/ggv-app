import { NextResponse } from "next/server";
import { checkBearer } from "@/lib/news/auth";
import { addPost, listPosts } from "@/lib/news/store";
import { StorageNotConfiguredError } from "@/lib/news/supabase";
import type { NewsPostInput } from "@/lib/news/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — public list of news posts, newest first. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

  try {
    const posts = await listPosts(limit);
    return NextResponse.json({ posts });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { posts: [], note: "storage_not_configured" },
        { status: 200 }
      );
    }
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST — create a news post. Requires `Authorization: Bearer <MCP_BEARER_TOKEN>`.
 * Same payload shape used by the MCP `save_news_post` tool, exposed as a plain
 * REST endpoint for testing with curl.
 */
export async function POST(req: Request) {
  if (!checkBearer(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<NewsPostInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required: Array<keyof NewsPostInput> = [
    "source",
    "originalText",
    "translation",
    "postedAt",
  ];
  for (const field of required) {
    if (!body[field] || typeof body[field] !== "string") {
      return NextResponse.json(
        { error: `Missing or invalid field: ${field}` },
        { status: 400 }
      );
    }
  }

  try {
    const post = await addPost({
      source: body.source as string,
      author: body.author,
      originalText: body.originalText as string,
      translation: body.translation as string,
      postedAt: body.postedAt as string,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { error: "Storage not configured (see SUPABASE_* env vars)" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: (e as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
