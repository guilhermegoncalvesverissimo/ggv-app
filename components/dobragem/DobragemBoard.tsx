"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileVideo, Link2, Loader2, MonitorPlay, Trash2 } from "lucide-react";
import { youtubeIdFrom, mergeIntoSentences } from "@/lib/dobragem/segments";
import { deleteProject, listProjects, putFile, saveProject } from "@/lib/dobragem/store";
import { transcribeFile } from "@/lib/dobragem/transcribe";
import { translateSegments } from "@/lib/dobragem/translate";
import type { DubProject, Segment } from "@/lib/dobragem/types";

const newId = () => `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function duration(segments: Segment[]): string {
  const s = Math.round(segments.at(-1)?.end ?? 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function DobragemBoard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<DubProject[]>(() => listProjects());
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  const finish = (p: DubProject) => {
    saveProject(p);
    setProjects(listProjects());
    setStatus(null);
    router.push(`/dobragem/${p.id}`);
  };

  const translate = (segs: Segment[]) =>
    translateSegments(segs, (done, total) => setStatus(`A traduzir… ${done}/${total} frases`));

  const fromLink = async () => {
    setError(null);
    const yt = youtubeIdFrom(link);
    if (!yt) {
      setError(
        /instagram|tiktok|twitter|x\.com|facebook|fb\.watch/i.test(link)
          ? "Essas redes não deixam ler os vídeos a partir de outra app. Guarda o vídeo no iPhone e carrega-o com “Escolher vídeo”."
          : "Cola um link do YouTube (ex.: youtube.com/watch?v=… ou youtu.be/…)."
      );
      return;
    }
    try {
      setStatus("A ler as legendas em inglês…");
      const r = await fetch(`/api/dobragem/youtube?url=${encodeURIComponent(link)}`, { credentials: "same-origin" });
      const j = (await r.json()) as { title?: string; segments?: Segment[]; error?: string };
      if (!r.ok || !j.segments) throw new Error(j.error ?? `HTTP ${r.status}`);
      const segments = await translate(j.segments);
      setLink("");
      finish({ id: newId(), kind: "youtube", title: j.title ?? "Vídeo do YouTube", youtubeId: yt, segments, createdAt: Date.now() });
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Algo correu mal.");
    }
  };

  const fromFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const raw = await transcribeFile(file, (p) =>
        setStatus(
          p.stage === "audio"
            ? "A preparar o áudio…"
            : p.stage === "download"
              ? `A descarregar o modelo de voz (só na 1.ª vez)… ${Math.round(p.progress)}%`
              : "A transcrever o inglês… demora mais ou menos o tempo do vídeo. Mantém a app aberta."
        )
      );
      const merged = mergeIntoSentences(raw);
      if (merged.length === 0) throw new Error("Não encontrei fala em inglês neste vídeo.");
      const segments = await translate(merged);
      setStatus("A guardar…");
      const id = newId();
      await putFile(id, file);
      finish({
        id,
        kind: "file",
        title: file.name.replace(/\.[^.]+$/, ""),
        fileKey: id,
        fileName: file.name,
        segments,
        createdAt: Date.now(),
      });
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Algo correu mal.");
    }
  };

  return (
    <>
      <section className="card space-y-3 p-4">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="url"
              inputMode="url"
              autoCapitalize="none"
              value={link}
              disabled={busy}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void fromLink()}
              placeholder="Link do YouTube"
              className="w-full rounded-full bg-canvas-soft/40 py-3 pl-9 pr-3 text-base text-ink outline-none ring-2 ring-transparent focus:bg-card-bg focus:ring-accent"
            />
          </div>
          <button
            type="button"
            disabled={busy || !link.trim()}
            onClick={() => void fromLink()}
            className="shrink-0 rounded-full bg-elevated px-4 text-sm font-medium text-white transition active:scale-95 disabled:opacity-40"
          >
            Dobrar
          </button>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-canvas-soft/60 px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98] disabled:opacity-40"
        >
          <FileVideo className="h-4 w-4" /> Escolher vídeo do iPhone
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*,audio/*"
          hidden
          onChange={(e) => {
            void fromFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {status && (
          <p className="flex items-center gap-2 px-1 text-sm text-ink">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> {status}
          </p>
        )}
        {error && <p className="px-1 text-sm text-danger">{error}</p>}
      </section>

      {projects.length > 0 && (
        <section className="card divide-y divide-card-border px-4">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-3">
              <Link href={`/dobragem/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-canvas-soft/60">
                  {p.kind === "youtube" ? <MonitorPlay className="h-5 w-5" /> : <FileVideo className="h-5 w-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{p.title}</span>
                  <span className="block text-xs text-muted">
                    {duration(p.segments)} · {p.segments.length} frases
                  </span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="Apagar"
                onClick={async () => {
                  await deleteProject(p.id);
                  setProjects(listProjects());
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
