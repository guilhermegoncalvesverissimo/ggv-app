"use client";

import { ChevronDown } from "lucide-react";
import type { Account } from "@/lib/wallet/types";

export function AccountPickerPill({
  accounts,
  selected,
  onOpen,
}: {
  accounts: Account[];
  selected: string | "all";
  onOpen: () => void;
}) {
  const account = accounts.find((a) => a.id === selected);
  const isAll = selected === "all";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 rounded-full bg-canvas-soft px-3 py-1.5 text-sm font-medium text-ink transition active:scale-[0.98]"
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ background: isAll ? "#0e0e10" : account?.color ?? "#0e0e10" }}
        aria-hidden
      />
      <span className="max-w-[140px] truncate">
        {isAll ? "Todas as contas" : account?.name ?? "Conta"}
      </span>
      <ChevronDown className="h-4 w-4 text-muted" />
    </button>
  );
}
