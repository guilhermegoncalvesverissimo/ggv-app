"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { cropAvatar } from "@/lib/networking/avatar";

const MAX_ZOOM = 5;

type View = { zoom: number; x: number; y: number };

/**
 * Full-screen photo adjuster: drag to move, pinch / slider / wheel to zoom.
 * The circle shows exactly what ends up in the bubble, and the previews
 * below show it at the real bubble sizes.
 *
 * Rendered in a portal on <body>: the Sheet panel is transformed, which would
 * otherwise turn this `fixed` overlay into one positioned inside the sheet.
 */
export function AvatarCropper({
  image,
  onCancel,
  onConfirm,
}: {
  image: HTMLImageElement;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;

  // Diameter of the crop circle, in CSS px.
  const [d, setD] = useState(280);
  useEffect(() => {
    const measure = () =>
      setD(Math.round(Math.min(320, window.innerWidth - 48, window.innerHeight * 0.42)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // `x`/`y` = offset of the image centre from the circle centre, in units of
  // the circle diameter, so the view survives a resize of the circle.
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });

  const base = 1 / Math.min(w, h); // image px → diameters, at zoom 1 (cover)

  const clamp = useCallback(
    (v: View): View => {
      const zoom = Math.min(MAX_ZOOM, Math.max(1, v.zoom));
      const s = base * zoom;
      const mx = Math.max(0, (w * s - 1) / 2);
      const my = Math.max(0, (h * s - 1) / 2);
      return {
        zoom,
        x: Math.min(mx, Math.max(-mx, v.x)),
        y: Math.min(my, Math.max(-my, v.y)),
      };
    },
    [base, w, h]
  );

  /** Zoom to `zoom`, keeping the point `f` (diameters from centre) fixed. */
  const zoomAround = useCallback(
    (v: View, zoom: number, fx = 0, fy = 0): View => {
      const z = Math.min(MAX_ZOOM, Math.max(1, zoom));
      const k = z / v.zoom;
      return clamp({ zoom: z, x: fx - (fx - v.x) * k, y: fy - (fy - v.y) * k });
    },
    [clamp]
  );

  // ---- gestures --------------------------------------------------------
  const areaRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mx: number; my: number } | null>(null);

  const snapshot = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 0) return null;
    const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const my = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const dist =
      pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { dist, mx, my };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = snapshot();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const prev = gesture.current;
    const next = snapshot();
    if (!prev || !next) return;
    gesture.current = next;

    const rect = areaRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;

    setView((v) => {
      let out = clamp({
        ...v,
        x: v.x + (next.mx - prev.mx) / d,
        y: v.y + (next.my - prev.my) / d,
      });
      if (prev.dist > 0 && next.dist > 0) {
        out = zoomAround(
          out,
          out.zoom * (next.dist / prev.dist),
          (next.mx - cx) / d,
          (next.my - cy) / d
        );
      }
      return out;
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    gesture.current = snapshot();
  };

  // Wheel / trackpad pinch (desktop). Needs a non-passive listener.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const fx = (e.clientX - rect.left - rect.width / 2) / d;
      const fy = (e.clientY - rect.top - rect.height / 2) / d;
      setView((v) => zoomAround(v, v.zoom * Math.exp(-e.deltaY * 0.0025), fx, fy));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [d, zoomAround]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  const confirm = () => {
    const s = base * view.zoom; // image px → diameters
    const side = 1 / s;
    const cx = w / 2 - view.x / s;
    const cy = h / 2 - view.y / s;
    onConfirm(cropAvatar(image, { sx: cx - side / 2, sy: cy - side / 2, side }));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar foto"
      className="fixed inset-0 z-[80] flex flex-col bg-black text-white"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
      }}
    >
      <div className="flex items-center justify-between px-4 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-2 text-sm font-medium text-white/80 active:opacity-60"
        >
          Cancelar
        </button>
        <span className="text-sm font-semibold">Ajustar foto</span>
        <button
          type="button"
          onClick={confirm}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0e0e10] active:scale-95"
        >
          Usar
        </button>
      </div>

      {/* Crop area */}
      <div
        ref={areaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setView((v) => clamp({ ...v, zoom: v.zoom > 1.01 ? 1 : 2 }))}
        className="relative flex flex-1 cursor-grab touch-none select-none items-center justify-center overflow-hidden active:cursor-grabbing"
      >
        <div className="relative" style={{ width: d, height: d }}>
          <Framed image={image} view={view} base={base} size={d} clip={false} />
          {/* Dim everything outside the circle */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/80"
            style={{ boxShadow: "0 0 0 200vmax rgba(0,0,0,0.62)" }}
          />
        </div>
        <p className="pointer-events-none absolute bottom-3 inset-x-0 text-center text-xs text-white/60">
          Arrasta para mover · Aperta para fazer zoom
        </p>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-6 pt-4">
        <button
          type="button"
          aria-label="Diminuir zoom"
          onClick={() => setView((v) => zoomAround(v, v.zoom / 1.25))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="range"
          aria-label="Zoom"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={view.zoom}
          onChange={(e) => setView((v) => zoomAround(v, Number(e.target.value)))}
          className="h-1 flex-1 accent-white"
        />
        <button
          type="button"
          aria-label="Aumentar zoom"
          onClick={() => setView((v) => zoomAround(v, v.zoom * 1.25))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Live previews at real bubble sizes */}
      <div className="px-6 pt-5">
        <p className="pb-3 text-center text-[11px] font-medium uppercase tracking-wide text-white/50">
          Pré-visualização
        </p>
        <div className="flex items-end justify-center gap-5">
          {[96, 64, 44].map((size) => (
            <div
              key={size}
              className="overflow-hidden rounded-full shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/15"
              style={{ width: size, height: size }}
            >
              <Framed image={image} view={view} base={base} size={size} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** The image positioned per `view` inside a `size`×`size` box. */
function Framed({
  image,
  view,
  base,
  size,
  clip = true,
}: {
  image: HTMLImageElement;
  view: View;
  base: number;
  size: number;
  clip?: boolean;
}) {
  const s = base * view.zoom * size; // image px → CSS px
  const iw = image.naturalWidth * s;
  const ih = image.naturalHeight * s;
  return (
    <div
      className={`relative h-full w-full ${clip ? "overflow-hidden rounded-full" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: iw,
          height: ih,
          left: size / 2 + view.x * size - iw / 2,
          top: size / 2 + view.y * size - ih / 2,
        }}
      />
    </div>
  );
}
