/// <reference lib="webworker" />
import { pipeline } from "@huggingface/transformers";

/**
 * Transcribes English speech on the device (Whisper, via transformers.js).
 * The model (~80 MB) is downloaded once and cached by the browser.
 * In: { audio: Float32Array (16 kHz mono) }. Out: progress / result / error.
 */
type Chunk = { text: string; timestamp: [number, number | null] };

const MODEL = "Xenova/whisper-base.en";

async function load(device: "webgpu" | "wasm") {
  return pipeline("automatic-speech-recognition", MODEL, {
    device,
    dtype: device === "webgpu" ? "fp32" : "q8",
    progress_callback: (p: { status: string; progress?: number; file?: string }) => {
      if (p.status === "progress" && typeof p.progress === "number") {
        postMessage({ type: "download", progress: p.progress, file: p.file });
      }
    },
  });
}

self.onmessage = async (e: MessageEvent<{ audio: Float32Array }>) => {
  try {
    let asr;
    const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
    try {
      asr = await load(hasGpu ? "webgpu" : "wasm");
    } catch {
      asr = await load("wasm");
    }
    postMessage({ type: "transcribing" });
    const out = (await asr(e.data.audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    })) as { text: string; chunks?: Chunk[] };
    postMessage({ type: "result", chunks: out.chunks ?? [] });
  } catch (err) {
    postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
