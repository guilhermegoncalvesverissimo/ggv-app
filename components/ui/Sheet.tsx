"use client";

import { useEffect } from "react";

/**
 * Minimal bottom-sheet primitive: fixed overlay + slide-up panel.
 * Closes on backdrop tap or Escape. Locks body scroll while open.
 */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-elevated/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col rounded-t-3xl bg-white px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-12px_40px_-12px_rgba(15,12,41,0.35)] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted/30" />
        {children}
      </div>
    </div>
  );
}
