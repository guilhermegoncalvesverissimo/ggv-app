"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { deleteTripPhoto, uploadTripPhoto } from "@/lib/viagens/api";
import { preparePhoto } from "@/lib/viagens/photos";
import { photoUrl, type TripPhoto } from "@/lib/viagens/types";

/** Photo grid for a trip: pick several at once, tap one to view full screen. */
export function TripPhotos({
  tripId,
  photos,
  setPhotos,
}: {
  tripId: string;
  photos: TripPhoto[];
  setPhotos: (update: (photos: TripPhoto[]) => TripPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<number | null>(null);

  const ordered = [...photos].sort((a, b) => a.createdAt - b.createdAt);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    setUploading((n) => n + list.length);
    // One at a time: keeps memory low on the phone and the order stable.
    for (const file of list) {
      try {
        const photo = await uploadTripPhoto(tripId, await preparePhoto(file));
        setPhotos((prev) => [...prev, photo]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao enviar a foto");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const remove = async (photo: TripPhoto) => {
    setViewer(null);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    try {
      await deleteTripPhoto(tripId, photo.id);
    } catch (e) {
      setPhotos((prev) => [...prev, photo]);
      setError(e instanceof Error ? e.message : "Falha ao apagar a foto");
    }
  };

  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-ink">
          Fotos
          {photos.length > 0 && (
            <span className="ml-1.5 font-normal text-muted">{photos.length}</span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ordered.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setViewer(i)}
            className="relative aspect-square overflow-hidden rounded-2xl bg-canvas-soft transition active:scale-[0.98]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- auth-gated route, not optimisable by next/image */}
            <img
              src={photoUrl(p.thumbPath)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div
            key={`up-${i}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-canvas-soft"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-card-border text-muted transition active:scale-[0.98]"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-medium">Adicionar</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void onPick(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="px-1 text-xs text-danger">{error}</p>}

      {viewer !== null && ordered[viewer] && (
        <PhotoViewer
          photos={ordered}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onDelete={remove}
        />
      )}
    </section>
  );
}

function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
  onDelete,
}: {
  photos: TripPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (p: TripPhoto) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const touchX = useRef<number | null>(null);
  const photo = photos[index];
  const go = (d: number) => {
    setConfirm(false);
    onIndex((index + d + photos.length) % photos.length);
  };

  // Hide the floating nav while the viewer is open (same flag as sheets).
  useEffect(() => {
    const body = document.body;
    body.dataset.sheetOpen = "true";
    return () => {
      if (!body.dataset.sheetCount) delete body.dataset.sheetOpen;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || photos.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),1rem)] text-white">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm text-white/70">
          {index + 1} / {photos.length}
        </span>
        {confirm ? (
          <button
            type="button"
            onClick={() => onDelete(photo)}
            className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white"
          >
            Apagar
          </button>
        ) : (
          <button
            type="button"
            aria-label="Apagar foto"
            onClick={() => setConfirm(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- auth-gated route */}
        <img
          key={photo.id}
          src={photoUrl(photo.path)}
          alt=""
          className="max-h-full max-w-full object-contain"
          style={{ backgroundImage: `url(${photoUrl(photo.thumbPath)})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => go(-1)}
              className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Seguinte"
              onClick={() => go(1)}
              className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="pb-[max(env(safe-area-inset-bottom),1rem)]" />
    </div>
  );
}
