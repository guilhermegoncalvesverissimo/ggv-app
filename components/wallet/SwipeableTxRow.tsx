"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { categoryById } from "@/lib/wallet/categories";
import { formatCents, formatDateRelative } from "@/lib/wallet/format";
import type { Account, Transaction } from "@/lib/wallet/types";

/** How far you must swipe to reveal the action button (snap point). */
const PEEK = 96;
/** How far you must swipe past to trigger an instant delete. */
const FULL = 188;
/** Pointer-move delta below which we don't commit to horizontal vs vertical. */
const DECIDE_THRESHOLD = 6;

export function SwipeableTxRow({
  tx,
  account,
  showAccountBadge,
  isOpen,
  onRequestOpen,
  onClose,
  onDelete,
}: {
  tx: Transaction;
  account: Account | undefined;
  showAccountBadge: boolean;
  isOpen: boolean;
  onRequestOpen: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const cat = categoryById(tx.category);
  const signed = tx.type === "income" ? tx.amountCents : -tx.amountCents;

  const [translate, setTranslate] = useState(isOpen ? -PEEK : 0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startTx = useRef(0);
  const decided = useRef<"horizontal" | "vertical" | null>(null);

  // Sync with parent: when openId changes externally, animate to the new state.
  useEffect(() => {
    if (exiting) return;
    setTranslate(isOpen ? -PEEK : 0);
  }, [isOpen, exiting]);

  const triggerDelete = () => {
    if (exiting) return;
    setExiting(true);
    // Slide off-screen, then call onDelete after the animation.
    setTranslate(-window.innerWidth);
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
          // capture not supported — that's fine, we still get moves
        }
      }
    }

    if (decided.current !== "horizontal") return;

    // Compute next translate with rubber-banding outside the natural range.
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
      // not captured
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
    // When the row is open and the user taps it, treat the tap as "close".
    if (exiting || dragging) return;
    if (isOpen) {
      setTranslate(0);
      onClose();
    }
  };

  return (
    <li className="relative overflow-hidden border-t border-canvas-soft/40 first:border-t-0">
      {/* Action background (revealed when swiping left) */}
      <button
        type="button"
        onClick={triggerDelete}
        aria-label="Apagar transação"
        tabIndex={isOpen ? 0 : -1}
        className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-center gap-1.5 bg-danger text-sm font-medium text-white"
      >
        <Trash2 className="h-4 w-4" /> Apagar
      </button>

      {/* Row content — translatable layer */}
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
        className="flex select-none items-center gap-3 bg-card-bg px-5 py-3"
      >
        <div className="relative h-10 w-10 shrink-0">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-canvas-soft text-lg">
            {cat?.emoji ?? "❓"}
          </div>
          {showAccountBadge && account && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card-bg"
              style={{ background: account.color }}
              aria-label={`Conta: ${account.name}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">
            {cat?.label ?? "Outras"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>{formatDateRelative(tx.date)}</span>
            {tx.note && <span className="truncate">· {tx.note}</span>}
          </div>
        </div>
        <span
          className={`text-sm font-semibold tabular-nums ${
            signed >= 0 ? "text-success" : "text-ink"
          }`}
        >
          {formatCents(signed, { signed: true })}
        </span>
      </div>
    </li>
  );
}
