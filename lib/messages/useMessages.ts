"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "./types";
import {
  deleteMessage as apiDelete,
  fetchMessages,
  sendMessage as apiSend,
} from "./api";

function tempId(): string {
  return `temp_m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const refetchScheduled = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const fresh = await fetchMessages();
      setMessages(fresh);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMessages()
      .then((fresh) => {
        if (!cancelled) setMessages(fresh);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleReconcile = useCallback(() => {
    if (refetchScheduled.current) return;
    refetchScheduled.current = true;
    setTimeout(() => {
      refetchScheduled.current = false;
      void refetch();
    }, 300);
  }, [refetch]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const optimistic: Message = {
      id: tempId(),
      text: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);
    void (async () => {
      try {
        const real = await apiSend(trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? real : m))
        );
      } catch {
        // Roll back the optimistic insert.
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    })();
  }, []);

  const remove = useCallback(
    (id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (id.startsWith("temp_")) return;
      void (async () => {
        try {
          await apiDelete(id);
        } catch {
          scheduleReconcile();
        }
      })();
    },
    [scheduleReconcile]
  );

  return { messages, hydrated, send, remove, refetch };
}
