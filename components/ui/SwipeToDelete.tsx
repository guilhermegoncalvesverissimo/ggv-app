"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

/** How far you must swipe to reveal the action button (snap point). */
const PEEK = 96;
/** How far past PEEK to trigger an instant delete on release. */
const FULL = 188;
/** Pointer-move delta below which we don't yet commit horizontal vs vertical. */
const DECIDE_THRESHOLD = 6;

/**
 * iOS-style left-swipe-to-delete wrapper.
 *
 * - Pan left to peek a red action button at PEEK.
 * - Pan past FULL → instant delete with slide-out animation.
 * - Tap on an open row → snaps closed (parent handles via `onClose`).
 * - Native vertical scroll keeps working thanks to `touch-action: pan-y`.
 *
 * The parent owns `isOpen` so it can ensure only one row is open at a time.
 */
export function SwipeToDelete({
  isOpen,
  onRequestOpen,
  onClose,
  onDelete,
  actionLabel = "Apagar",
  className = "",
  contentClassName = "",
  children,
}: {
  isOpen: boolean;
  onRequestOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
  actionLabel?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const [translate, setTranslate] = useState(isOpen ? -PEEK : 0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startTx = useRef(0);
  const decided = useRef<"horizontal" | "vertical" | null>(null);

  useEffect(() => {
    if (exiting) return;
    setTranslate(isOpen ? -PEEK : 0);
  }, [isOpen, exiting]);

  const triggerDelete = () => {
    if (exiting) return;
    setExiting(true);
    const w = typeof window !== "undefined" ? window.innerWidth : 480;
    setTranslate(-w);
    window.setTimeout(() => onDelete(), 220);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (exiting) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTx.current = translate;
    decided.current = null;
    setDragging(false);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (exiting || startX.current == null || startY.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (decided.current === null) {
      if (Math.abs(dx) < DECIDE_THRESHOLD && Math.abs(dy) < DECIDE_THRESHOLD) {
        return;
      }
      decided.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      if (decided.current === "horizontal") {
        setDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture not supported — moves still fire */
        }
      }
    }

    if (decided.current !== "horizontal") return;

    let next = startTx.current + dx;
    if (next > 0) next = next * 0.2;
    const minAllowed = -FULL * 1.4;
    if (next < minAllowed) next = minAllowed + (next - minAllowed) * 0.2;
    setTranslate(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (exiting) return;
    const wasHorizontal = decided.current === "horizontal";
    setDragging(false);
    decided.current = null;
    startX.current = null;
    startY.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    if (!wasHorizontal) return;

    if (translate <= -FULL) {
      triggerDelete();
    } else if (translate <= -PEEK * 0.5) {
      setTranslate(-PEEK);
      if (!isOpen) onRequestOpen();
    } else {
      setTranslate(0);
      if (isOpen) onClose();
    }
  };

  const onContentClick = () => {
    if (exiting || dragging) return;
    if (isOpen) {
      setTranslate(0);
      onClose();
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={triggerDelete}
        aria-label={actionLabel}
        tabIndex={isOpen ? 0 : -1}
        className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-center gap-1.5 bg-danger text-sm font-medium text-white"
      >
        <Trash2 className="h-4 w-4" /> {actionLabel}
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onContentClick}
        style={{
          transform: `translateX(${translate}px)`,
          touchAction: "pan-y",
          transition: dragging
            ? "none"
            : "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className={`select-none bg-card-bg ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
