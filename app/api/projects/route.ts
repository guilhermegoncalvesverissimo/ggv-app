import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Project, ProjectStatus } from "@/lib/projects/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  tags: string[] | null;
  status: ProjectStatus;
  emoji: string | null;
  color: string;
  created_at: string;
  updated_at: string;
};

function toProject(r: Row): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    url: r.url ?? undefined,
    tags: r.tags ?? [],
    status: r.status,
    emoji: r.emoji ?? undefined,
    color: r.color,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

const tableMissing = (msg?: string) =>
  !!msg && /could not find the table|does not exist/i.test(msg);

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const { data, error } = await sb
    .from("ggv_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (tableMissing(error?.message)) {
    return NextResponse.json({ projects: [], note: "storage_not_configured" });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    projects: ((data ?? []) as Row[]).map(toProject),
  });
}

export async function POST(req: Request) {
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

  const name = (body.name ?? "").trim();
  const status = body.status;
  const color = body.color;
  if (
    !name ||
    !color ||
    !status ||
    !["active", "idea", "paused", "done"].includes(status)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  const ts = body.createdAt ? new Date(body.createdAt).toISOString() : undefined;
  const { data, error } = await sb
    .from("ggv_projects")
    .insert({
      name,
      description: body.description?.trim() || null,
      url: body.url?.trim() || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status,
      emoji: body.emoji?.trim() || null,
      color,
      ...(ts ? { created_at: ts, updated_at: ts } : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { project: toProject(data as Row) },
    { status: 201 }
  );
}
