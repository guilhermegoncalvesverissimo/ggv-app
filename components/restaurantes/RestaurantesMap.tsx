"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { corDe, type Restaurante } from "@/lib/restaurantes/types";

// Mapa (Leaflet + OpenStreetMap). Com 3000+ pontos, os marcadores são
// círculos desenhados em canvas — muito mais leves do que ícones.
export default function RestaurantesMap({
  items,
  selectedId,
  userPos,
  onSelect,
}: {
  items: Restaurante[];
  selectedId: number | null;
  userPos: { lat: number; lng: number } | null;
  onSelect: (id: number) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<number, L.CircleMarker>());
  const me = useRef<L.CircleMarker | null>(null);
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

  // A minha posição.
  useEffect(() => {
    if (!map.current) return;
    me.current?.remove();
    me.current = null;
    if (!userPos) return;
    me.current = L.circleMarker([userPos.lat, userPos.lng], {
      radius: 8, weight: 3, color: "#ffffff", fillColor: "#2563eb", fillOpacity: 1,
    }).bindTooltip("Estou aqui").addTo(map.current);
    map.current.flyTo([userPos.lat, userPos.lng], 12, { duration: 0.6 });
  }, [userPos]);

  return <div ref={el} className="h-[52vh] w-full overflow-hidden rounded-3xl ring-1 ring-card-border z-0" />;
}
