"use client";

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { countdownLabel, formatRange, tripPhase } from "@/lib/viagens/dates";
import type { Trip } from "@/lib/viagens/types";
import { cn } from "@/lib/utils";

export function TripCard({ trip }: { trip: Trip }) {
  const range = formatRange(trip.startDate, trip.endDate);
  const countdown = countdownLabel(trip.startDate, trip.endDate);
  const phase = tripPhase(trip.startDate, trip.endDate);
  const done = trip.checklist.filter((c) => c.done).length;
  const pending = trip.id.startsWith("temp_");

  return (
    <Link
      href={pending ? "#" : `/viagens/${trip.id}`}
      aria-disabled={pending}
      className={cn(
        "card flex w-full items-center gap-3 p-4 text-left transition active:scale-[0.99]",
        phase === "terminada" && "opacity-70",
        pending && "pointer-events-none opacity-60"
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl text-white shadow-[0_8px_20px_-10px_rgba(15,12,41,0.45)]"
        style={{ background: `linear-gradient(160deg, ${trip.color}, ${trip.color}cc)` }}
      >
        {trip.emoji ?? trip.name[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink">
            {trip.name}
          </h3>
          {countdown && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                phase === "a-decorrer"
                  ? "bg-success/15 text-success"
                  : "bg-canvas-soft/40 text-muted"
              )}
            >
              {countdown}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
          {trip.destination && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </span>
          )}
          {range && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {range}
            </span>
          )}
        </div>
        {(trip.items.length > 0 || trip.checklist.length > 0) && (
          <p className="mt-1 text-xs text-muted">
            {trip.items.length > 0 &&
              `${trip.items.length} no roteiro`}
            {trip.items.length > 0 && trip.checklist.length > 0 && " · "}
            {trip.checklist.length > 0 && `${done}/${trip.checklist.length} na checklist`}
          </p>
        )}
      </div>
    </Link>
  );
}
