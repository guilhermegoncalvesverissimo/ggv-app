"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/** Minimal wrapper around the YouTube IFrame Player API. */

type YTPlayer = {
  getCurrentTime(): number;
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    }
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

export type PlayerHandle = {
  getTime(): number;
  play(): void;
  pause(): void;
  setMuted(m: boolean): void;
};

export const YouTubePlayer = forwardRef<
  PlayerHandle,
  { videoId: string; muted: boolean; onPlayingChange: (p: boolean) => void }
>(function YouTubePlayer({ videoId, muted, onPlayingChange }, ref) {
  const el = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const mutedRef = useRef(muted);
  const cb = useRef(onPlayingChange);
  useEffect(() => {
    cb.current = onPlayingChange;
    mutedRef.current = muted;
  });

  useEffect(() => {
    let cancelled = false;
    void loadApi().then((YT) => {
      if (cancelled || !el.current) return;
      const host = document.createElement("div");
      el.current.appendChild(host);
      player.current = new YT.Player(host, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => (mutedRef.current ? player.current?.mute() : player.current?.unMute()),
          onStateChange: (e) => cb.current(e.data === 1),
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (muted) player.current?.mute();
    else player.current?.unMute();
  }, [muted]);

  useImperativeHandle(ref, () => ({
    getTime: () => player.current?.getCurrentTime() ?? 0,
    play: () => player.current?.playVideo(),
    pause: () => player.current?.pauseVideo(),
    setMuted: (m) => (m ? player.current?.mute() : player.current?.unMute()),
  }));

  return <div ref={el} className="aspect-video w-full overflow-hidden rounded-3xl bg-black [&_iframe]:h-full [&_iframe]:w-full" />;
});
