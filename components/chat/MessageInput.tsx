"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

const MAX_LEN = 4000;
const MAX_HEIGHT_PX = 140;

/** Floating composer pinned above the bottom nav. Multi-line, auto-grows up
 *  to MAX_HEIGHT_PX, then internal scroll. Cmd/Ctrl+Enter or the send button
 *  submit; bare Enter on mobile inserts a newline (default soft-keyboard
 *  behaviour), Shift+Enter likewise on desktop. */
export function MessageInput({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(6);
    }
    // Re-focus so you can keep firing notes.
    requestAnimationFrame(() => ref.current?.focus());
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-10 mx-auto max-w-[480px] px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="pointer-events-auto flex items-end gap-2 rounded-3xl border border-card-border bg-card-bg p-1.5 shadow-[0_8px_24px_-12px_rgba(15,12,41,0.18)]"
      >
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.metaKey || e.ctrlKey) &&
              !e.shiftKey
            ) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Apontamento, ideia, lembrete…"
          enterKeyHint="enter"
          className="min-h-[2.5rem] flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-snug text-ink outline-none placeholder:text-muted-soft"
          style={{ maxHeight: MAX_HEIGHT_PX }}
        />
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
