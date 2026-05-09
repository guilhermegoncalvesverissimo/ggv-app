"use client";

import { useRef, useState } from "react";
import type { Person } from "@/lib/networking/types";
import { bubbleSize } from "@/lib/networking/sizing";
import { colorFor, initialsOf } from "@/lib/networking/colors";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

export function Bubble({
  person,
  onTap,
  onLongPress,
}: {
  person: Person;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const size = bubbleSize(person.encounters.length);
  const color = colorFor(person.id + person.name);
  const initials = initialsOf(person.name);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);
  const [pressing, setPressing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const cancelTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const startPress = (x: number, y: number) => {
    startPos.current = { x, y };
    longPressFired.current = false;
    setPressing(true);
    timer.current = setTimeout(() => {
      longPressFired.current = true;
      setPressing(false);
      setPulseKey((k) => k + 1);
      // Light haptic where supported.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(12);
      }
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const movePress = (x: number, y: number) => {
    if (!startPos.current) return;
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) {
      cancelTimer();
      setPressing(false);
    }
  };

  const endPress = () => {
    const wasLong = longPressFired.current;
    cancelTimer();
    setPressing(false);
    if (!wasLong) {
      onTap();
    }
  };

  return (
    <button
      type="button"
      aria-label={`${person.name} — ${person.encounters.length} encontro${
        person.encounters.length === 1 ? "" : "s"
      }`}
      onPointerDown={(e) => {
        // Only main button / touch.
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        startPress(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => movePress(e.clientX, e.clientY)}
      onPointerUp={endPress}
      onPointerCancel={() => {
        cancelTimer();
        setPressing(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${color}, ${color}cc)`,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "manipulation",
      }}
      className={`relative flex shrink-0 select-none items-center justify-center rounded-full text-white shadow-[0_8px_24px_-8px_rgba(15,12,41,0.35)] transition-transform duration-150 ${
        pressing ? "scale-95" : "scale-100"
      }`}
    >
      {/* Long-press feedback ring */}
      {pulseKey > 0 && (
        <span
          key={pulseKey}
          aria-hidden
          className="pulse-ring pointer-events-none absolute inset-0 rounded-full"
        />
      )}

      <div className="flex flex-col items-center justify-center leading-none">
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: Math.round(size * 0.32) }}
        >
          {person.badge || initials}
        </span>
        {person.encounters.length > 0 && (
          <span
            className="mt-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ fontSize: Math.max(9, Math.round(size * 0.1)) }}
          >
            ×{person.encounters.length}
          </span>
        )}
      </div>

      {/* Press progress arc — visual cue that something is happening */}
      {pressing && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 0 3px rgba(255,255,255,0.55) inset",
          }}
        />
      )}

      <span className="sr-only">
        Long press to log encounter. Tap for details.
      </span>
    </button>
  );
}
