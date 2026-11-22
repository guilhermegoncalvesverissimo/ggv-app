"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { CATEGORIAS, corDe, type Origem, type Restaurante } from "@/lib/restaurantes/types";
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

type Lugar = { label: string; lat: number; lng: number };

function parseCoords(q: string): { lat: number; lng: number } | null {
  const pats = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  ];
  for (const re of pats) {
    const m = q.match(re);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

async function nominatim(q: string): Promise<Lugar[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=pt&countrycodes=pt,es&q=${encodeURIComponent(q)}`;
  const rows = (await (await fetch(url, { headers: { Accept: "application/json" } })).json()) as { display_name: string; lat: string; lon: string }[];
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

async function photon(q: string): Promise<Lugar[]> {
  // Centrado em Portugal para dar prioridade a resultados de cá.
  const url = `https://photon.komoot.io/api/?limit=6&lat=39.6&lon=-8.4&q=${encodeURIComponent(q)}`;
  const data = (await (await fetch(url)).json()) as {
    features: { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> }[];
  };
  return (data.features ?? []).map((f) => {
    const p = f.properties;
    const label = [p.name, p.street && `${p.street}${p.housenumber ? ` ${p.housenumber}` : ""}`, p.city || p.town || p.village, p.state, p.country]
      .filter(Boolean).join(", ");
    return { label: label || "Local", lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
  });
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
  const [origin, setOrigin] = useState<Origem | null>(null);
  // Pesquisa de locais (terra, morada, sítio) — OpenStreetMap/Nominatim.
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<{ label: string; lat: number; lng: number }[] | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);
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
    if (origin) return [...list].sort((a, b) => km(origin, a) - km(origin, b));
    const order = (c: string) => { const i = CATEGORIAS.findIndex((x) => x.nome === c); return i < 0 ? 99 : i; };
    return [...list].sort((a, b) => order(a.c) - order(b.c) || a.n.localeCompare(b.n, "pt"));
  }, [all, hidden, query, origin]);

  const sig = `${query}|${[...hidden].join(",")}|${origin ? `${origin.lat},${origin.lng}` : ""}`;
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
      (p) => { setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude, label: "A minha posição", kind: "me" }); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function searchPlace(e?: React.FormEvent) {
    e?.preventDefault();
    const q = placeQuery.trim();
    if (!q) return;
    // 1) Coordenadas ou link do Google Maps colados ("39.91, -8.62",
    //    ".../@39.91,-8.62,15z", "...?q=39.91,-8.62", "!3d39.91!4d-8.62").
    const coords = parseCoords(q);
    if (coords) { pickPlace({ label: "Local escolhido", ...coords }); return; }
    // Link curto do Google Maps (maps.app.goo.gl) não traz coordenadas.
    if (/goo\.gl|maps\.app/.test(q)) {
      alert("Esse link curto não traz a localização. No Google Maps, toca no sítio, copia as coordenadas (ex.: 39.9163, -8.6285) e cola-as aqui.");
      return;
    }
    setPlaceSearching(true);
    try {
      // 2) OpenStreetMap (Nominatim); 3) se não achar, Photon, que tolera
      //    melhor nomes de estabelecimentos e erros de escrita.
      let list = await nominatim(q);
      if (!list.length) list = await photon(q);
      if (list.length === 1) pickPlace(list[0]); else setPlaceResults(list);
    } catch {
      setPlaceResults([]);
    } finally {
      setPlaceSearching(false);
    }
  }

  function pickPlace(p: { label: string; lat: number; lng: number }) {
    setOrigin({ ...p, label: p.label.split(",").slice(0, 2).join(","), kind: "place" });
    setPlaceResults(null);
    setSelectedId(null);
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
        <button onClick={origin?.kind === "me" ? () => setOrigin(null) : locate} aria-label="Perto de mim"
          className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium",
            origin?.kind === "me" ? "bg-accent text-on-accent" : "bg-canvas-soft text-ink")}>
          <LocateFixed className={cn("h-4 w-4", locating && "animate-pulse")} />
          {origin?.kind === "me" ? "Perto" : "Perto de mim"}
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

      {/* Procurar um local no mapa */}
      <div className="relative">
        <form onSubmit={searchPlace} className="flex items-center gap-2 rounded-full bg-canvas-soft px-4 py-2.5">
          <MapPin className="h-4 w-4 text-[#ea4335]" />
          <input value={placeQuery} onChange={(e) => { setPlaceQuery(e.target.value); setPlaceResults(null); }}
            placeholder="Local: terra, morada, sítio ou coordenadas"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          {origin?.kind === "place" ? (
            <button type="button" onClick={() => { setOrigin(null); setPlaceQuery(""); }} aria-label="Limpar local">
              <X className="h-4 w-4 text-muted" />
            </button>
          ) : (
            <button type="submit" disabled={placeSearching || !placeQuery.trim()} className="text-xs font-medium text-ink disabled:text-muted">
              {placeSearching ? "A procurar…" : "Ir"}
            </button>
          )}
        </form>
        {placeResults && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl bg-card-bg shadow-lg ring-1 ring-card-border">
            {placeResults.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">Não encontrei esse local.</p>
            ) : placeResults.map((p, i) => (
              <button key={i} onClick={() => pickPlace(p)} className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-canvas-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <span className="line-clamp-2">{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <RestaurantesMap items={filtered} selectedId={selectedId} origin={origin} onSelect={setSelectedId} />

      {/* Restaurante escolhido */}
      {selected && (
        <div id="restaurante-detalhe" className="card scroll-mt-24 space-y-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink">{selected.n}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corDe(selected.c) }} />
                {selected.c}
                {origin && <> · {km(origin, selected).toFixed(1)} km</>}
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
            {filtered.length} restaurante{filtered.length === 1 ? "" : "s"}{origin ? ` · do mais perto ${origin.kind === "me" ? "de mim" : `de ${origin.label}`} para o mais longe` : ""}
          </p>
          {filtered.slice(0, limit).map((r) => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex w-full items-start gap-3 px-5 py-3 text-left">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: corDe(r.c) }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{r.n}</span>
                {r.d && <span className="block truncate text-xs text-muted">{r.d.split("\n")[0]}</span>}
              </span>
              {origin && <span className="shrink-0 text-xs text-muted">{km(origin, r).toFixed(1)} km</span>}
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
