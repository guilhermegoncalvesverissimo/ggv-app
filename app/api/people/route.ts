import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Person } from "@/lib/networking/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersonRow = {
  id: string;
  name: string;
  badge: string | null;
  avatar: string | null;
  created_at: string;
};
type EncounterRow = {
  id: string;
  person_id: string;
  at: string;
};

function rowsToPeople(
  people: PersonRow[],
  encounters: EncounterRow[]
): Person[] {
  const byPerson = new Map<string, { id: string; at: number }[]>();
  for (const e of encounters) {
    const list = byPerson.get(e.person_id) ?? [];
    list.push({ id: e.id, at: new Date(e.at).getTime() });
    byPerson.set(e.person_id, list);
  }
  for (const list of byPerson.values()) {
    list.sort((a, b) => a.at - b.at);
  }
  return people.map((p) => ({
    id: p.id,
    name: p.name,
    badge: p.badge ?? undefined,
    avatar: p.avatar ?? undefined,
    encounters: byPerson.get(p.id) ?? [],
    createdAt: new Date(p.created_at).getTime(),
  }));
}

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const [{ data: people, error: pErr }, { data: enc, error: eErr }] =
    await Promise.all([
      sb.from("people").select("*").order("created_at", { ascending: true }),
      sb.from("encounters").select("*"),
    ]);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });
  return NextResponse.json({
    people: rowsToPeople(
      (people ?? []) as PersonRow[],
      (enc ?? []) as EncounterRow[]
    ),
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

  let body: { name?: string; badge?: string; avatar?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("people")
    .insert({
      name,
      badge: body.badge?.trim() || null,
      avatar: body.avatar ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { person: rowsToPeople([data as PersonRow], [])[0] },
    { status: 201 }
  );
}

