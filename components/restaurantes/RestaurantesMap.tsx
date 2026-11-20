"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { corDe, type Origem, type Restaurante } from "@/lib/restaurantes/types";

const PIN = L.divIcon({
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 40 15 40s15-14.1 15-25.2C30 6.6 23.3 0 15 0z" fill="#ea4335" stroke="#a50e0e" stroke-width="1"/><circle cx="15" cy="14.5" r="5.5" fill="#a50e0e"/></svg>`,
});

// Mapa (Leaflet + OpenStreetMap). Com 3000+ pontos, os marcadores são
// círculos desenhados em canvas — muito mais leves do que ícones.
export default function RestaurantesMap({
  items,
  selectedId,
  origin,
  onSelect,
}: {
  items: Restaurante[];
  selectedId: number | null;
  origin: Origem | null;
  onSelect: (id: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<number, L.CircleMarker>());
  const me = useRef<L.Layer | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { preferCanvas: true, zoomControl: false }).setView([39.6, -8.4], 7);
    L.control.zoom({ position: "topright" }).addTo(m);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // Pontos visíveis (filtros e pesquisa).
  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    markers.current.clear();
    for (const r of items) {
      const mk = L.circleMarker([r.lat, r.lng], {
        radius: 6, weight: 1.5, color: "#ffffff", fillColor: corDe(r.c), fillOpacity: 0.95,
      });
      mk.bindTooltip(r.n, { direction: "top", offset: [0, -6] });
      mk.on("click", () => onSelectRef.current(r.id));
      mk.addTo(g);
      markers.current.set(r.id, mk);
    }
  }, [items]);

  // Ponto escolhido: destaca e centra.
  useEffect(() => {
    markers.current.forEach((mk, id) => mk.setStyle({ radius: id === selectedId ? 10 : 6, weight: id === selectedId ? 3 : 1.5 }));
    if (selectedId == null || !map.current) return;
    const mk = markers.current.get(selectedId);
    if (mk) {
      mk.bringToFront();
      map.current.flyTo(mk.getLatLng(), Math.max(map.current.getZoom(), 14), { duration: 0.6 });
    }
  }, [selectedId, items]);

  // Ponto de referência: a minha posição (ponto azul) ou o local
  // pesquisado (pin vermelho, como no Google Maps).
  useEffect(() => {
    if (!map.current) return;
    me.current?.remove();
    me.current = null;
    if (!origin) return;
    const ll: L.LatLngTuple = [origin.lat, origin.lng];
    me.current = origin.kind === "me"
      ? L.circleMarker(ll, { radius: 8, weight: 3, color: "#ffffff", fillColor: "#2563eb", fillOpacity: 1 })
          .bindTooltip("Estou aqui").addTo(map.current)
      : L.marker(ll, { icon: PIN, zIndexOffset: 1000 }).bindTooltip(origin.label, { direction: "top", offset: [0, -34] }).addTo(map.current);
    map.current.flyTo(ll, origin.kind === "me" ? 12 : 13, { duration: 0.6 });
  }, [origin]);

  return <div ref={el} className="h-[52vh] w-full overflow-hidden rounded-3xl ring-1 ring-card-border z-0" />;
}
