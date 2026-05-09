"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import type { Encounter } from "@/lib/networking/types";

const dayMonthFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});

function fmtRelative(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return dayMonthFmt.format(new Date(ts));
}

export function EncounterTimeline({
  encounters,
  onDelete,
}: {
  encounters: Encounter[];
  onDelete: (encounterId: string) => void;
}) {
  // Most recent first.
  const ordered = useMemo(
    () => [...encounters].sort((a, b) => b.at - a.at),
    [encounters]
  );
  const [openId, setOpenId] = useState<string | null>(null);

  if (ordered.length === 0) {
    return (
      <div className="rounded-2xl bg-canvas-soft/30 p-4 text-center text-xs text-muted">
        <Clock className="mx-auto mb-1 h-4 w-4" />
        Sem encontros registados ainda.
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl bg-canvas-soft/30">
      {ordered.map((e, i) => (
        <SwipeToDelete
          key={e.id}
          isOpen={openId === e.id}
          onRequestOpen={() => setOpenId(e.id)}
          onClose={() =>
            setOpenId((id) => (id === e.id ? null : id))
          }
          onDelete={() => {
            onDelete(e.id);
            if (openId === e.id) setOpenId(null);
          }}
          className={i === 0 ? "" : "border-t border-canvas-soft/60"}
          contentClassName="bg-transparent"
        >
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-ink">{fmtRelative(e.at)}</span>
            <span className="text-xs text-muted tabular-nums">
              {dayMonthFmt.format(new Date(e.at))} ·{" "}
              {timeFmt.format(new Date(e.at))}
            </span>
          </div>
        </SwipeToDelete>
      ))}
    </ul>
  );
}
