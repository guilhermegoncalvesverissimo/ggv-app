"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pause, Play, Subtitles, Volume2, VolumeX } from "lucide-react";
import { getFile, getProject } from "@/lib/dobragem/store";
import type { DubProject } from "@/lib/dobragem/types";
import { cn } from "@/lib/utils";
import { YouTubePlayer, type PlayerHandle } from "./YouTubePlayer";
import { unlockSpeech, useDubbing, usePortugueseVoices } from "./useDubbing";

const PREFS = "ggv:dobragem:prefs";
type Prefs = { voiceURI?: string; rate: number; original: boolean; subs: boolean };

function readPrefs(): Prefs {
  try {
    return { rate: 1, original: false, subs: true, ...JSON.parse(localStorage.getItem(PREFS) ?? "{}") };
  } catch {
    return { rate: 1, original: false, subs: true };
  }
}

export function DubPlayer({ id }: { id: string }) {
  // Client-only component (loaded with ssr: false), so localStorage is safe here.
  const [project] = useState<DubProject | null>(() => getProject(id));
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [playing, setPlaying] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileMissing, setFileMissing] = useState(false);
  const yt = useRef<PlayerHandle>(null);
  const video = useRef<HTMLVideoElement>(null);
  const voices = usePortugueseVoices();
  const voice = voices.find((v) => v.voiceURI === prefs.voiceURI) ?? voices[0];

  const update = (p: Partial<Prefs>) =>
    setPrefs((prev) => {
      const next = { ...prev, ...p };
      try {
        localStorage.setItem(PREFS, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  useEffect(() => {
    if (project?.kind !== "file" || !project.fileKey) return;
    let url: string | null = null;
    void getFile(project.fileKey)
      .then((blob) => {
        if (!blob) return setFileMissing(true);
        url = URL.createObjectURL(blob);
        setFileUrl(url);
      })
      .catch(() => setFileMissing(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [project]);

  const getTime = useCallback(
    () => (project?.kind === "youtube" ? yt.current?.getTime() ?? 0 : video.current?.currentTime ?? 0),
    [project?.kind]
  );
  const segments = useMemo(() => project?.segments ?? [], [project]);
  const current = useDubbing({ segments, getTime, playing, enabled: true, voice, rate: prefs.rate });

  const toggle = () => {
    unlockSpeech();
    if (project?.kind === "youtube") {
      if (playing) yt.current?.pause();
      else yt.current?.play();
    } else if (video.current) {
      if (video.current.paused) void video.current.play();
      else video.current.pause();
    }
  };

  if (!project) {
    return (
      <div className="space-y-4 pt-1">
        <BackLink />
        <div className="card p-6 text-center text-sm text-muted">Este vídeo já não está guardado neste iPhone.</div>
      </div>
    );
  }

  const line = current >= 0 ? segments[current] : null;

  return (
    <div className="space-y-4 pt-1">
      <BackLink />
      <h1 className="text-xl font-semibold leading-tight tracking-tight">{project.title}</h1>

      {project.kind === "youtube" && project.youtubeId ? (
        <YouTubePlayer ref={yt} videoId={project.youtubeId} muted={!prefs.original} onPlayingChange={setPlaying} />
      ) : fileMissing ? (
        <div className="card p-6 text-center text-sm text-muted">
          O ficheiro do vídeo já não está guardado neste iPhone. Apaga este item e carrega o vídeo outra vez.
        </div>
      ) : (
        <video
          ref={video}
          src={fileUrl ?? undefined}
          playsInline
          controls
          muted={!prefs.original}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="aspect-video w-full rounded-3xl bg-black"
        />
      )}

      {prefs.subs && (
        <div className="min-h-[4.5rem] rounded-3xl bg-canvas-soft/60 px-4 py-3 text-center text-base leading-snug text-ink">
          {line ? line.pt ?? line.en : <span className="text-muted">…</span>}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-elevated px-4 py-3.5 text-base font-medium text-white transition active:scale-[0.98]"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {playing ? "Pausa" : "Ouvir em português"}
      </button>
      <p className="-mt-2 px-2 text-center text-xs text-muted">
        Usa este botão para começar: o iPhone só deixa a página falar depois de um toque aqui.
      </p>

      <section className="card space-y-4 p-4">
        <div className="flex gap-2">
          <Toggle on={prefs.original} onClick={() => update({ original: !prefs.original })}>
            {prefs.original ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Som original
          </Toggle>
          <Toggle on={prefs.subs} onClick={() => update({ subs: !prefs.subs })}>
            <Subtitles className="h-4 w-4" /> Legendas
          </Toggle>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Velocidade da voz · {prefs.rate.toFixed(1)}×</span>
          <input
            type="range"
            min={0.8}
            max={1.5}
            step={0.1}
            value={prefs.rate}
            onChange={(e) => update({ rate: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--color-ink)]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Voz</span>
          {voices.length === 0 ? (
            <p className="mt-1 text-sm text-muted">
              Sem vozes portuguesas neste dispositivo. No iPhone: Definições → Acessibilidade → Conteúdo falado → Vozes →
              Português (Portugal).
            </p>
          ) : (
            <select
              value={voice?.voiceURI}
              onChange={(e) => update({ voiceURI: e.target.value })}
              className="mt-1 w-full rounded-2xl bg-canvas-soft/40 px-4 py-3 text-base text-ink outline-none"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
          <span className="mt-1 block text-xs text-muted">
            Dica: as vozes “melhoradas” soam muito mais naturais. Descarrega-as em Definições → Acessibilidade → Conteúdo
            falado → Vozes.
          </span>
        </label>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/dobragem" className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink">
      <ChevronLeft className="h-4 w-4" /> Vídeos
    </Link>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
        on ? "bg-elevated text-white" : "bg-canvas-soft/60 text-ink"
      )}
    >
      {children}
    </button>
  );
}
