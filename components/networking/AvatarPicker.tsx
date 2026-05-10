"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { compressAvatar } from "@/lib/networking/avatar";
import { colorFor, initialsOf } from "@/lib/networking/colors";

/**
 * Circular avatar with file-input upload. Tap to pick a photo. When one is
 * set, a small ✕ button removes it. Photos are compressed to a small JPEG
 * data URL before bubbling up.
 */
export function AvatarPicker({
  name,
  badge,
  value,
  onChange,
  size = 96,
}: {
  name: string;
  badge?: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const color = colorFor(name || "?");
  const initials = initialsOf(name || "?");

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressAvatar(file);
      onChange(dataUrl);
    } catch {
      // Could surface an error toast — for now, silently keep the previous avatar.
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={value ? "Substituir foto" : "Adicionar foto"}
        disabled={busy}
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center overflow-hidden rounded-full text-white shadow-[0_8px_20px_-10px_rgba(15,12,41,0.35)] transition active:scale-95 disabled:opacity-60"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-semibold"
            style={{
              background: `linear-gradient(160deg, ${color}, ${color}cc)`,
              fontSize: Math.round(size * 0.32),
            }}
          >
            {badge || initials}
          </span>
        )}

        {/* Camera overlay hint */}
        <span className="pointer-events-none absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-white shadow-md ring-2 ring-white">
          <Camera className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </button>

      {value && !busy && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Remover foto"
          className="absolute -top-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink shadow-md ring-2 ring-white"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </div>
  );
}
