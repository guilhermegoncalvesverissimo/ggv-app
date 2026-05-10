"use client";

import { Bell, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between pb-3">
      <button
        aria-label="Pesquisar"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-soft transition active:scale-95"
      >
        <Search className="h-5 w-5 text-ink" strokeWidth={2.25} />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink">Guilherme</span>
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-canvas-deep text-xs font-semibold text-white shadow-sm">
            GV
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-canvas" />
        </div>
        <button
          aria-label="Notificações"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-soft transition active:scale-95"
        >
          <Bell className="h-5 w-5 text-ink" strokeWidth={2.25} />
        </button>
      </div>
    </header>
  );
}
