import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Project } from "@/lib/projects/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }

  let body: Partial<Project>;
  try {
    body = (await req.json()) as Partial<Project>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") {
    const n = body.name.trim();
    if (!n) return NextResponse.json({ error: "Empty name" }, { status: 400 });
    patch.name = n;
  }
  if ("description" in body)
    patch.description = body.description?.trim() || null;
  if ("url" in body) patch.url = body.url?.trim() || null;
  if ("tags" in body)
    patch.tags = Array.isArray(body.tags) ? body.tags : [];
  if (typeof body.status === "string") patch.status = body.status;
  if ("emoji" in body) patch.emoji = body.emoji?.trim() || null;
  if (typeof body.color === "string" && body.color) patch.color = body.color;

  const { error } = await sb.from("ggv_projects").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const { error } = await sb.from("ggv_projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
