import { NextResponse } from "next/server";
import { mergeIntoSentences, youtubeIdFrom } from "@/lib/dobragem/segments";
import type { Segment } from "@/lib/dobragem/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * English captions of a YouTube video, as timed segments. Reads the caption
 * track list from the watch page (falling back to the Android player API)
 * and downloads the English track — manual captions preferred over
 * automatic ones. Must run server-side: YouTube doesn't allow these requests
 * from the browser (CORS).
 */

type Track = { baseUrl: string; languageCode: string; kind?: string; name?: { simpleText?: string } };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function tracksFromWatchPage(id: string): Promise<{ tracks: Track[]; title?: string }> {
  const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9", Cookie: "CONSENT=YES+1" },
    cache: "no-store",
  });
  const html = await r.text();
  const m = html.match(/"captionTracks":(\[.*?\])/);
  const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1];
  if (!m) return { tracks: [], title };
  try {
    return { tracks: JSON.parse(m[1]) as Track[], title };
  } catch {
    return { tracks: [], title };
  }
}

async function tracksFromPlayerApi(id: string): Promise<{ tracks: Track[]; title?: string }> {
  const r = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "com.google.android.youtube/19.44.38 (Linux; U; Android 14)" },
    body: JSON.stringify({
      videoId: id,
      context: { client: { clientName: "ANDROID", clientVersion: "19.44.38", androidSdkVersion: 34, hl: "en" } },
    }),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => ({}))) as {
    captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Track[] } };
    videoDetails?: { title?: string };
  };
  return {
    tracks: j.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [],
    title: j.videoDetails?.title,
  };
}

type Json3 = { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] };

async function download(track: Track): Promise<Segment[]> {
  const url = new URL(track.baseUrl.replace(/\\u0026/g, "&"));
  url.searchParams.set("fmt", "json3");
  const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  const text = await r.text();
  if (!text.trim()) return [];
  const j = JSON.parse(text) as Json3;
  return (j.events ?? [])
    .filter((e) => e.segs && typeof e.tStartMs === "number")
    .map((e) => ({
      start: e.tStartMs! / 1000,
      end: (e.tStartMs! + (e.dDurationMs ?? 2000)) / 1000,
      en: e.segs!.map((s) => s.utf8 ?? "").join(""),
    }));
}

function pickEnglish(tracks: Track[]): Track | undefined {
  const en = tracks.filter((t) => t.languageCode?.startsWith("en"));
  return en.find((t) => t.kind !== "asr") ?? en[0];
}

export async function GET(req: Request) {
  const id = youtubeIdFrom(new URL(req.url).searchParams.get("url") ?? "");
  if (!id) return NextResponse.json({ error: "Isso não parece um link do YouTube." }, { status: 400 });

  let title: string | undefined;
  for (const source of [tracksFromWatchPage, tracksFromPlayerApi]) {
    try {
      const got = await source(id);
      title ??= got.title;
      const track = pickEnglish(got.tracks);
      if (!track) continue;
      const parts = await download(track);
      if (parts.length) {
        return NextResponse.json({ id, title: title ?? "Vídeo do YouTube", segments: mergeIntoSentences(parts) });
      }
    } catch {
      /* try the next source */
    }
  }
  return NextResponse.json(
    {
      error:
        "Não consegui obter legendas em inglês deste vídeo. Pode não ter legendas, ou o YouTube bloqueou o pedido. Alternativa: guarda o vídeo no iPhone e carrega-o como ficheiro.",
    },
    { status: 422 }
  );
}
