"use client";

import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

/** Distance (px) the user must drag past to trigger the refresh. */
const THRESHOLD = 70;
/** Maximum visible pull translate (px). After this, drag adds nothing. */
const MAX_PULL = 140;
/** Movement (px) below which we don't commit to horizontal vs vertical. */
const DECIDE = 6;

/**
 * iOS-style pull-to-refresh wrapper. Looks for the nearest `.app-scroll`
 * ancestor and only activates when that container is scrolled to the top.
 *
 * - Pull down past the threshold + release → `onRefresh()` runs
 * - Rubber-banding past MAX_PULL keeps the gesture from feeling unbounded
 * - Spinner rotates with the pull progress and spins continuously while
 *   `onRefresh` is in flight
 * - `touch-action: pan-y` so native vertical scroll behaviour is preserved
 *   on areas where we don't take over
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}) {
  const [translate, setTranslate] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const decided = useRef<"vertical" | "horizontal" | null>(null);

  const findScrollContainer = (): HTMLElement | null => {
    if (!wrapperRef.current) return null;
    return wrapperRef.current.closest(".app-scroll") as HTMLElement | null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (refreshing) return;
    const sc = findScrollContainer();
    if (!sc || sc.scrollTop > 0) return;
    startY.current = e.clientY;
    startX.current = e.clientX;
    decided.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (refreshing) return;
    if (startY.current == null || startX.current == null) return;
    const dy = e.clientY - startY.current;
    const dx = e.clientX - startX.current;

    if (decided.current === null) {
      if (Math.abs(dx) < DECIDE && Math.abs(dy) < DECIDE) return;
      decided.current = Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal";
      if (decided.current === "vertical") setDragging(true);
    }

    if (decided.current !== "vertical") return;

    if (dy <= 0) {
      setTranslate(0);
      return;
    }
    // Rubber-band easing: first part 1:1, then progressively damped.
    const eased = dy < THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * 0.4;
    setTranslate(Math.min(eased, MAX_PULL));
  };

  const onPointerUp = () => {
    if (refreshing) return;
    const wasVertical = decided.current === "vertical";
    startY.current = null;
    startX.current = null;
    decided.current = null;
    setDragging(false);

    if (!wasVertical) return;

    if (translate >= THRESHOLD) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(8);
      }
      doRefresh();
    } else {
      setTranslate(0);
    }
  };

  const doRefresh = async () => {
    setRefreshing(true);
    setTranslate(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setTranslate(0);
      setRefreshing(false);
    }
  };

  const progress = Math.min(translate / THRESHOLD, 1);
  const rotation = refreshing ? null : progress * 270;

  return (
    <div
      ref={wrapperRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "pan-y" }}
      className={`relative ${className}`}
    >
      {/* Spinner indicator — fades in as you pull, rotates with progress,
       *  spins continuously while refreshing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center"
        style={{
          top: 0,
          opacity: refreshing ? 1 : progress,
          transform: `translate(-50%, calc(${translate}px - 100%))`,
          transition:
            dragging || refreshing
              ? "opacity 100ms"
              : "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms",
        }}
      >
        <RefreshCw
          className={`h-5 w-5 text-muted ${refreshing ? "animate-spin" : ""}`}
          style={
            rotation !== null
              ? { transform: `rotate(${rotation}deg)` }
              : undefined
          }
        />
      </div>

      {/* Translatable content layer */}
      <div
        style={{
          transform: `translateY(${translate}px)`,
          transition:
            dragging || refreshing
              ? "none"
              : "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
