import type { Segment } from "./types";

export type TranscribeProgress =
  | { stage: "audio" }
  | { stage: "download"; progress: number }
  | { stage: "transcribing" };

/** Decodes the video's audio to 16 kHz mono (what Whisper expects). */
async function decodeAudio(file: Blob): Promise<Float32Array> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx({ sampleRate: 16000 });
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer());
    if (buf.numberOfChannels === 1) return buf.getChannelData(0);
    const a = buf.getChannelData(0);
    const b = buf.getChannelData(1);
    const mono = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) mono[i] = (a[i] + b[i]) / 2;
    return mono;
  } catch {
    throw new Error("Não consegui ler o áudio deste vídeo.");
  } finally {
    void ctx.close();
  }
}

/** Runs Whisper in a worker; resolves with timed English segments. */
export async function transcribeFile(
  file: Blob,
  onProgress: (p: TranscribeProgress) => void
): Promise<Segment[]> {
  onProgress({ stage: "audio" });
  const audio = await decodeAudio(file);
  const worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  try {
    return await new Promise<Segment[]>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent) => {
        const m = e.data as
          | { type: "download"; progress: number }
          | { type: "transcribing" }
          | { type: "result"; chunks: { text: string; timestamp: [number, number | null] }[] }
          | { type: "error"; message: string };
        if (m.type === "download") onProgress({ stage: "download", progress: m.progress });
        else if (m.type === "transcribing") onProgress({ stage: "transcribing" });
        else if (m.type === "error") reject(new Error(`Transcrição falhou: ${m.message}`));
        else
          resolve(
            m.chunks.map((c) => ({
              start: c.timestamp[0] ?? 0,
              end: c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 3,
              en: c.text,
            }))
          );
      };
      worker.onerror = (e) => reject(new Error(e.message || "A transcrição falhou."));
      worker.postMessage({ audio }, [audio.buffer]);
    });
  } finally {
    worker.terminate();
  }
}
