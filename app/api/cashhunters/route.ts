import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/news/supabase";
import type { Campaign, Step } from "@/lib/cashhunters/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  url: string | null;
  target_cents: number;
  steps: Step[] | null;
  created_at: string;
  updated_at: string;
};

function toCampaign(r: Row): Campaign {
  return {
    id: r.id,
    name: r.name,
    url: r.url ?? undefined,
    targetCents: r.target_cents,
    steps: Array.isArray(r.steps) ? r.steps : [],
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
    .from("ggv_cashhunters")
    .select("*")
    .order("updated_at", { ascending: false });

  if (tableMissing(error?.message)) {
    return NextResponse.json({
      campaigns: [],
      note: "storage_not_configured",
    });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    campaigns: ((data ?? []) as Row[]).map(toCampaign),
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

  let body: Partial<Campaign>;
  try {
    body = (await req.json()) as Partial<Campaign>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const target =
    typeof body.targetCents === "number" && Number.isFinite(body.targetCents)
      ? Math.max(0, Math.round(body.targetCents))
      : 0;

  const { data, error } = await sb
    .from("ggv_cashhunters")
    .insert({
      name,
      url: body.url?.trim() || null,
      target_cents: target,
      steps: Array.isArray(body.steps) ? body.steps : [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    { campaign: toCampaign(data as Row) },
    { status: 201 }
  );
}
