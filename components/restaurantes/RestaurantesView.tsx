"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { CATEGORIAS, corDe, type Restaurante } from "@/lib/restaurantes/types";
import { cn } from "@/lib/utils";

// O Leaflet mexe no window: só no browser.
const RestaurantesMap = dynamic(() => import("./RestaurantesMap"), {
  ssr: false,
  loading: () => <div className="h-[52vh] w-full animate-pulse rounded-3xl bg-canvas-soft" />,
});

const PAGE = 40;

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, t = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(t(b.lat - a.lat) / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(t(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Descrição com os links clicáveis.
function Descricao({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm text-ink-soft">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noreferrer" className="text-[#2563eb] underline underline-offset-2">
            {p.includes("instagram.com") ? "Ver no Instagram" : p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

export function RestaurantesView() {
  const [all, setAll] = useState<Restaurante[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  // "Desiludiu ou não volto" começa escondida.
  const [hidden, setHidden] = useState<Set<string>>(new Set(["Desiludiu ou não volto"]));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  // Quantos se mostram na lista; volta ao início quando os filtros mudam.
  const [shown, setShown] = useState<{ sig: string; n: number }>({ sig: "", n: PAGE });

  useEffect(() => {
    fetch("/api/restaurantes")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Restaurante[]) => setAll(d))
      .catch(() => setError("Não foi possível carregar os restaurantes."));
  }, []);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of all ?? []) m.set(r.c, (m.get(r.c) ?? 0) + 1);
    return m;
  }, [all]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    const list = (all ?? []).filter((r) => !hidden.has(r.c) && (!q || norm(r.n).includes(q) || norm(r.d).includes(q)));
    if (userPos) return [...list].sort((a, b) => km(userPos, a) - km(userPos, b));
    const order = (c: string) => { const i = CATEGORIAS.findIndex((x) => x.nome === c); return i < 0 ? 99 : i; };
    return [...list].sort((a, b) => order(a.c) - order(b.c) || a.n.localeCompare(b.n, "pt"));
  }, [all, hidden, query, userPos]);

  const sig = `${query}|${[...hidden].join(",")}|${userPos ? `${userPos.lat},${userPos.lng}` : ""}`;
  const limit = shown.sig === sig ? shown.n : PAGE;

  const selected = selectedId != null ? (all ?? []).find((r) => r.id === selectedId) ?? null : null;

  function toggle(c: string) {
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c); else n.add(c);
      return n;
    });
  }

  function locate() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div className="space-y-4 pb-28">
      {/* Pesquisa + perto de mim */}
      <div className="flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-canvas-soft px-4 py-2.5">
          <Search className="h-4 w-4 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar restaurante, prato, terra…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpar pesquisa"><X className="h-4 w-4 text-muted" /></button>
          )}
        </label>
        <button onClick={userPos ? () => setUserPos(null) : locate} aria-label="Perto de mim"
          className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium",
            userPos ? "bg-accent text-on-accent" : "bg-canvas-soft text-ink")}>
          <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
          {userPos ? "Perto" : "Perto de mim"}
        </button>
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIAS.filter((c) => counts.has(c.nome)).map((c) => {
          const on = !hidden.has(c.nome);
          return (
            <button key={c.nome} onClick={() => toggle(c.nome)}
              className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                on ? "bg-card-bg text-ink ring-card-border" : "bg-transparent text-muted ring-transparent line-through")}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.cor, opacity: on ? 1 : 0.35 }} />
              {c.nome}
              <span className="text-muted">{counts.get(c.nome)}</span>
            </button>
          );
        })}
      </div>

      <RestaurantesMap items={filtered} selectedId={selectedId} userPos={userPos} onSelect={setSelectedId} />

      {/* Restaurante escolhido */}
      {selected && (
        <div className="card space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink">{selected.n}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corDe(selected.c) }} />
                {selected.c}
                {userPos && <> · {km(userPos, selected).toFixed(1)} km</>}
              </p>
            </div>
            <button onClick={() => setSelectedId(null)} aria-label="Fechar" className="text-muted"><X className="h-5 w-5" /></button>
          </div>
          {selected.d ? <Descricao text={selected.d} /> : <p className="text-sm text-muted">Sem descrição.</p>}
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selected.n} ${selected.lat},${selected.lng}`)}`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-medium text-on-accent">
            <MapPin className="h-4 w-4" /> Abrir no Google Maps
          </a>
        </div>
      )}

      {/* Lista */}
      {!all ? (
        <div className="h-24 animate-pulse rounded-3xl bg-canvas-soft" />
      ) : (
        <div className="card divide-y divide-card-border">
          <p className="px-5 py-3 text-xs text-muted">
            {filtered.length} restaurante{filtered.length === 1 ? "" : "s"}{userPos ? " · do mais perto para o mais longe" : ""}
          </p>
          {filtered.slice(0, limit).map((r) => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex w-full items-start gap-3 px-5 py-3 text-left">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: corDe(r.c) }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{r.n}</span>
                {r.d && <span className="block truncate text-xs text-muted">{r.d.split("\n")[0]}</span>}
              </span>
              {userPos && <span className="shrink-0 text-xs text-muted">{km(userPos, r).toFixed(1)} km</span>}
            </button>
          ))}
          {filtered.length > limit && (
            <button onClick={() => setShown({ sig, n: limit + PAGE })} className="w-full px-5 py-3 text-sm font-medium text-ink">
              Mostrar mais
            </button>
          )}
        </div>
      )}
    </div>
  );
}
