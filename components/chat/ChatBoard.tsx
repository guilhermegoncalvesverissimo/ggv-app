"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useMessages } from "@/lib/messages/useMessages";
import type { Message } from "@/lib/messages/types";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

const dayMonthFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "long",
});

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ts: number, now = Date.now()): string {
  const dKey = dayKey(ts);
  const today = dayKey(now);
  if (dKey === today) return "Hoje";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dKey === dayKey(yesterday.getTime())) return "Ontem";
  return dayMonthFmt.format(new Date(ts));
}

/** Group an already-chronological list of messages into buckets keyed by day. */
function bucketByDay(messages: Message[]) {
  const out: Array<{ label: string; items: Message[] }> = [];
  let currentKey = "";
  for (const m of messages) {
    const k = dayKey(m.createdAt);
    if (k !== currentKey) {
      out.push({ label: dayLabel(m.createdAt), items: [m] });
      currentKey = k;
    } else {
      out[out.length - 1].items.push(m);
    }
  }
  return out;
}

export function ChatBoard() {
  const { messages, hydrated, send, remove } = useMessages();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const lastCount = useRef(0);
  const scrollAnchor = useRef<HTMLDivElement>(null);

  const buckets = useMemo(() => bucketByDay(messages), [messages]);

  // Auto-scroll to bottom on initial load + whenever a new message is added
  // while the user was already near the bottom. Uses the .app-scroll
  // container set up by the root layout.
  useLayoutEffect(() => {
    if (!hydrated) return;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (!grew) return;
    const sc = document.querySelector(".app-scroll") as HTMLElement | null;
    if (!sc) return;
    // Only auto-stick to bottom if we were within ~120px of the bottom
    // before this render. Avoids yanking the view when scrolling history.
    const fromBottom =
      sc.scrollHeight - sc.scrollTop - sc.clientHeight;
    if (fromBottom < 200 || messages.length === lastCount.current) {
      // Use requestAnimationFrame so it runs after the DOM commits.
      requestAnimationFrame(() => {
        sc.scrollTop = sc.scrollHeight;
      });
    }
  }, [messages.length, hydrated]);

  // First hydration: jump to bottom unconditionally.
  useEffect(() => {
    if (!hydrated) return;
    const sc = document.querySelector(".app-scroll") as HTMLElement | null;
    if (sc) sc.scrollTop = sc.scrollHeight;
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="card flex items-center justify-center p-10 text-sm text-muted">
        A carregar…
      </div>
    );
  }

  const confirm = confirmId
    ? messages.find((m) => m.id === confirmId) ?? null
    : null;

  return (
    <>
      {messages.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <MessageCircle
              className="h-6 w-6 text-accent"
              strokeWidth={2.25}
            />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Sem notas</h2>
          <p className="max-w-xs text-sm text-muted">
            Escreve qualquer coisa em baixo — ideias, lembretes, o que quiseres.
            Tudo é guardado e sincroniza entre dispositivos.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {buckets.map((bucket, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-canvas-soft px-2.5 py-0.5 text-[11px] font-medium text-muted">
                  {bucket.label}
                </span>
              </div>
              <div className="space-y-1.5">
                {bucket.items.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onLongPress={() => setConfirmId(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Sentinel for potential future "scroll to here" anchoring. */}
          <div ref={scrollAnchor} />
        </div>
      )}

      <MessageInput onSend={send} />

      <Sheet open={!!confirm} onClose={() => setConfirmId(null)}>
        {confirm && (
          <>
            <h2 className="px-1 pb-1 text-lg font-semibold tracking-tight">
              Apagar nota?
            </h2>
            <p className="px-1 pt-1 text-sm text-muted">
              Esta acção não tem volta. A nota será removida do servidor.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-2xl bg-canvas-soft px-3 py-2 text-sm text-ink/80">
              {confirm.text}
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-full bg-canvas-soft px-4 py-3 text-sm font-medium text-ink transition active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  remove(confirm.id);
                  setConfirmId(null);
                }}
                className="flex-1 rounded-full bg-danger px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                Apagar
              </button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
