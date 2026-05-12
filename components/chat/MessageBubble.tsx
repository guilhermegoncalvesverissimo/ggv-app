"use client";

import { useRef, useState } from "react";
import type { Message } from "@/lib/messages/types";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;

const timeFmt = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageBubble({
  message,
  onLongPress,
}: {
  message: Message;
  onLongPress: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setPressing(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    setPressing(true);
    timer.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(12);
      }
      onLongPress();
      cancel();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancel();
  };

  const pending = message.id.startsWith("temp_");

  return (
    <div className="flex justify-end">
      <div className="flex max-w-[80%] flex-col items-end">
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={cancel}
          onPointerCancel={cancel}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "text",
            touchAction: "manipulation",
          }}
          className={`group whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-accent px-3.5 py-2 text-left text-[15px] leading-snug text-on-accent shadow-sm transition ${
            pressing ? "scale-[0.99] opacity-90" : ""
          } ${pending ? "opacity-70" : ""}`}
        >
          {message.text}
        </button>
        <time
          dateTime={new Date(message.createdAt).toISOString()}
          className="mt-0.5 px-1 text-[10px] tabular-nums text-muted"
        >
          {timeFmt.format(new Date(message.createdAt))}
          {pending && " · a enviar…"}
        </time>
      </div>
    </div>
  );
}
