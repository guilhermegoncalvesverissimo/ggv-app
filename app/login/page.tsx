"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const json = (await r.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? `HTTP ${r.status}`);
        setSubmitting(false);
        return;
      }
      // Cookie is set — force a full-page navigation so the proxy re-runs.
      window.location.href = next;
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
      <div className="flex flex-col items-center gap-2 pb-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
          <Lock className="h-6 w-6 text-accent" strokeWidth={2.25} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">GGV</h1>
        <p className="text-center text-sm text-muted">
          Introduz a password para acederes à app.
        </p>
      </div>

      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-2xl bg-canvas-soft px-4 py-3 text-base text-ink outline-none ring-2 ring-transparent transition focus:bg-canvas focus:ring-accent"
      />

      {error && (
        <p className="text-center text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!password.trim() || submitting}
        className="w-full rounded-full bg-elevated px-4 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-40"
      >
        {submitting ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
