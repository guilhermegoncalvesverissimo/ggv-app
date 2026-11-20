import { NextResponse } from "next/server";
import data from "@/data/gastropico.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista estática (cópia do mapa do Gastropiço). Fica atrás do login, como o
// resto da app; o browser guarda-a em cache durante um dia.
export async function GET() {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=86400" },
  });
}
