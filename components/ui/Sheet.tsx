"use client";

import { useEffect } from "react";

/**
 * Minimal bottom-sheet primitive: fixed overlay + slide-up panel.
 * Closes on backdrop tap or Escape. Locks body scroll while open.
 *
 * While open, sets `document.body.dataset.sheetOpen = "true"` (refcounted so
 * nested sheets work). The floating BottomNav listens to that attribute via
 * CSS to fade itself out — without that, on iOS Safari the navbar can sit
 * on top of the sheet's action buttons even with z-50, because fixed-element
 * stacking quirks ignore plain z-index in some PWA contexts.
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

  // Refcounted body data attribute so nested sheets correctly hide/show the navbar.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const count = Number(body.dataset.sheetCount ?? "0") + 1;
    body.dataset.sheetCount = String(count);
    body.dataset.sheetOpen = "true";
    return () => {
      const next = Number(body.dataset.sheetCount ?? "1") - 1;
      if (next <= 0) {
        delete body.dataset.sheetCount;
        delete body.dataset.sheetOpen;
      } else {
        body.dataset.sheetCount = String(next);
      }
    };
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] transition ${
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
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-w-[480px] flex-col rounded-t-3xl bg-card-bg px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-12px_40px_-12px_rgba(15,12,41,0.35)] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted/30" />
        {children}
      </div>
    </div>
  );
}
