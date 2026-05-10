"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => {
        toggle();
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(6);
        }
      }}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-soft transition active:scale-95"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-ink" strokeWidth={2.25} />
      ) : (
        <Moon className="h-5 w-5 text-ink" strokeWidth={2.25} />
      )}
    </button>
  );
}
