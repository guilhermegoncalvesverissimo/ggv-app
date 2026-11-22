"use client";

import { useEffect, useRef, useState } from "react";
import type { Segment } from "@/lib/dobragem/types";

/**
 * Speaks each segment in Portuguese with the device's voice as the video
 * reaches it. If a line is long for its slot the voice speeds up a little;
 * if the previous line is still being read when the next starts, it's cut so
 * the dub never drifts behind the picture.
 */

const CHARS_PER_SEC = 15; // pt speech at rate 1, roughly

export function findSegment(segments: Segment[], t: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].start <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans >= 0 && t <= segments[ans].end + 0.5 ? ans : -1;
}

export function usePortugueseVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const load = () =>
      setVoices(
        speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith("pt"))
          // pt-PT first, then the "enhanced/premium" ones (longer names on iOS).
          .sort((a, b) => Number(b.lang === "pt-PT") - Number(a.lang === "pt-PT") || b.name.length - a.name.length)
      );
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

/** iOS only lets a page speak after a tap: call this from one. */
export function unlockSpeech() {
  if (typeof speechSynthesis === "undefined") return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  speechSynthesis.speak(u);
}

export function useDubbing({
  segments,
  getTime,
  playing,
  enabled,
  voice,
  rate,
}: {
  segments: Segment[];
  getTime: () => number;
  playing: boolean;
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number;
}) {
  const [current, setCurrent] = useState(-1);
  const spoken = useRef(-1);
  const lastT = useRef(0);
  const opts = useRef({ voice, rate, enabled });
  useEffect(() => {
    opts.current = { voice, rate, enabled };
  });

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    if (!playing) {
      speechSynthesis.cancel();
      spoken.current = -1; // on resume, the current line is read again
      return;
    }
    const id = setInterval(() => {
      const t = getTime();
      if (Math.abs(t - lastT.current) > 2) {
        // Seek: drop whatever was being said.
        speechSynthesis.cancel();
        spoken.current = -1;
      }
      lastT.current = t;
      const i = findSegment(segments, t);
      setCurrent(i);
      if (i < 0 || i === spoken.current) return;
      spoken.current = i;
      const { voice: v, rate: r, enabled: on } = opts.current;
      if (!on) return;
      const seg = segments[i];
      const text = seg.pt ?? seg.en;
      // Started late (resume/seek mid-line)? Only the time left counts.
      const slot = Math.max(0.8, seg.end - Math.max(seg.start, t));
      const u = new SpeechSynthesisUtterance(text);
      u.lang = v?.lang ?? "pt-PT";
      if (v) u.voice = v;
      u.rate = Math.min(2, Math.max(0.7, Math.max(1, text.length / CHARS_PER_SEC / slot) * r));
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }, 150);
    return () => clearInterval(id);
  }, [playing, segments, getTime]);

  useEffect(() => () => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }, []);

  return current;
}
