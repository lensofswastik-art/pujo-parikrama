"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { Pandal } from "@/data/types";
import { NO_VEHICLE_ZONES } from "@/data/parikramas";
import { bn, type Plan, type Pt } from "@/lib/planner";
import { legGeometry } from "@/lib/geometry";

/**
 * Free, keyless vector basemaps from OpenFreeMap (OpenStreetMap data).
 * Other styles: /styles/bright, /styles/positron, /styles/fiord.
 */
export type MapTheme = "light" | "dark";
const MAP_STYLES: Record<MapTheme, string> = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

/** Route + zone overlays, re-added whenever the base style changes. */
function addOverlays(m: maplibregl.Map, theme: MapTheme) {
  const dark = theme === "dark";
  if (!m.getSource("zones")) m.addSource("zones", { type: "geojson", data: zonesFC });
  m.addLayer({ id: "zones-fill", type: "fill", source: "zones", paint: { "fill-color": "#E5484D", "fill-opacity": dark ? 0.1 : 0.07 } });
  m.addLayer({ id: "zones-line", type: "line", source: "zones", paint: { "line-color": dark ? "#FF8A7A" : "#C2272D", "line-width": 1.4, "line-dasharray": [3, 3], "line-opacity": 0.7 } });
  // The chosen starting area: a soft dusk-blue disc so a tap visibly lands somewhere.
  if (!m.getSource("start-area")) m.addSource("start-area", { type: "geojson", data: empty });
  m.addLayer({ id: "start-area-fill", type: "fill", source: "start-area", paint: { "fill-color": dark ? "#8FB8D9" : "#2F5F8A", "fill-opacity": dark ? 0.08 : 0.05 } });
  m.addLayer({ id: "start-area-line", type: "line", source: "start-area", paint: { "line-color": dark ? "#8FB8D9" : "#2F5F8A", "line-width": 2, "line-opacity": 0.9 } });
  if (!m.getSource("route")) m.addSource("route", { type: "geojson", data: empty });
  m.addLayer({
    id: "route-ride", type: "line", source: "route", filter: ["in", ["get", "mode"], ["literal", ["auto", "bus", "cab"]]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": dark ? "#D8D3E4" : "#2A2F48", "line-width": 4.5, "line-opacity": 0.85 },
  });
  m.addLayer({
    id: "route-metro", type: "line", source: "route", filter: ["==", ["get", "mode"], "metro"],
    paint: { "line-color": dark ? "#8FB8D9" : "#2F5F8A", "line-width": 4, "line-dasharray": [2, 1.5] },
  });
  m.addLayer({
    id: "route-walk-halo", type: "line", source: "route", filter: ["==", ["get", "mode"], "walk"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": dark ? "#0A0A0B" : "#FFFFFF", "line-width": 9, "line-opacity": 0.85 },
  });
  m.addLayer({
    id: "route-walk", type: "line", source: "route", filter: ["==", ["get", "mode"], "walk"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": dark ? "#FF6B6B" : "#C2272D", "line-width": 5, "line-dasharray": [0, 2] },
  });
}
const KOLKATA: [number, number] = [88.37, 22.565];

interface Props {
  pandals: Pandal[];
  plan: Plan | null;
  start: Pt | null;
  selectedId: string | null;
  /** Only an explicit tap reframes the map; the default highlight doesn't. */
  focusId?: string | null;
  showZones: boolean;
  /** Radius of the highlight ring drawn around the chosen start, in metres. */
  areaRadiusM?: number;
  mapTheme: MapTheme;
  fitKey: string;
  onSelect: (id: string) => void;
}

type FC = GeoJSON.FeatureCollection;
const empty: FC = { type: "FeatureCollection", features: [] };

function circle(lng: number, lat: number, radiusM: number, steps = 48): [number, number][] {
  const out: [number, number][] = [];
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    out.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return out;
}

const zonesFC: FC = {
  type: "FeatureCollection",
  features: NO_VEHICLE_ZONES.map((z) => ({
    type: "Feature",
    properties: { label: z.label },
    geometry: { type: "Polygon", coordinates: [circle(z.lng, z.lat, z.radiusM)] },
  })),
};

/**
 * Padding that keeps the framed area clear of the search bar and the sheet.
 * Clamped so it never exceeds the canvas — MapLibre silently refuses to move
 * when padding is larger than the map (e.g. a short phone with the sheet open).
 */
function sheetPadding() {
  const w = window.innerWidth, h = window.innerHeight;
  const mobile = w < 900;
  const snap = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--snap")) || 200;
  const p = mobile ? { top: 150, bottom: snap + 24, left: 32, right: 32 } : { top: 60, bottom: 60, left: 460, right: 60 };
  const maxV = Math.max(0, h - 120), maxH = Math.max(0, w - 120);
  if (p.top + p.bottom > maxV) { const k = maxV / (p.top + p.bottom); p.top *= k; p.bottom *= k; }
  if (p.left + p.right > maxH) { const k = maxH / (p.left + p.right); p.left *= k; p.right *= k; }
  return p;
}

export default function MapView({ pandals, plan, start, selectedId, focusId, showZones, areaRadiusM, mapTheme, fitKey, onSelect }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, { m: maplibregl.Marker; el: HTMLDivElement }>>(new Map());
  const startMarker = useRef<maplibregl.Marker | null>(null);
  const [ready, setReady] = useState(false);
  /** Bumps on every base-style load so overlays and data get re-applied. */
  const [styleTick, setStyleTick] = useState(0);
  const themeRef = useRef(mapTheme);
  themeRef.current = mapTheme;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /* Create the map once */
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLES[mapTheme],
      center: KOLKATA,
      zoom: 11.6,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    m.on("style.load", () => {
      addOverlays(m, themeRef.current);
      setReady(true);
      setStyleTick((t) => t + 1);
    });
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  /* Switch base map between light and dark */
  const firstTheme = useRef(true);
  useEffect(() => {
    if (firstTheme.current) { firstTheme.current = false; return; }
    map.current?.setStyle(MAP_STYLES[mapTheme]);
  }, [mapTheme]);

  /* Highlight the chosen starting area */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const src = m.getSource("start-area") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(start && areaRadiusM
      ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [circle(start.lng, start.lat, areaRadiusM, 72)] } }] }
      : empty);
  }, [start, areaRadiusM, ready, styleTick]);

  /* Zones visibility */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const v = showZones ? "visible" : "none";
    m.setLayoutProperty("zones-fill", "visibility", v);
    m.setLayoutProperty("zones-line", "visibility", v);
  }, [showZones, ready, styleTick]);

  /* Pandal markers: create once, restyle on plan / selection change */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const order = new Map<string, number>();
    plan?.stops.forEach((s, i) => order.set(s.id, i + 1));
    for (const p of pandals) {
      let rec = markers.current.get(p.id);
      if (!rec) {
        const el = document.createElement("div");
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", p.name);
        el.title = p.name;
        el.addEventListener("click", (e) => { e.stopPropagation(); onSelectRef.current(p.id); });
        el.addEventListener("keydown", (e) => { if (e.key === "Enter") onSelectRef.current(p.id); });
        const mk = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(m);
        rec = { m: mk, el };
        markers.current.set(p.id, rec);
      }
      const n = order.get(p.id);
      const cls = `${p.mustSee ? " must" : ""}${p.id === selectedId ? " sel" : ""}`;
      if (n) {
        rec.el.classList.add("mk", "mk-on"); rec.el.classList.remove("mk-off");
        rec.el.innerHTML = `<div class="mk-num${cls}"><span>${bn(n)}</span></div>`;
        rec.m.setOffset([0, 0]);
      } else {
        rec.el.classList.add("mk", "mk-off"); rec.el.classList.remove("mk-on");
        rec.el.innerHTML = `<div class="mk-dot${cls}"></div>`;
        rec.m.setOffset([0, 7]);
      }
      rec.el.style.zIndex = n ? "3" : p.id === selectedId ? "4" : "1";
    }
  }, [pandals, plan, selectedId, ready]);

  /* Start marker */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    startMarker.current?.remove();
    if (!start) return;
    const el = document.createElement("div");
    el.className = "mk-start-wrap";
    el.innerHTML = `<div class="mk-start"></div><span class="mk-start-label"></span>`;
    (el.querySelector(".mk-start-label") as HTMLElement).textContent = start.label ?? "Start";
    startMarker.current = new maplibregl.Marker({ element: el, anchor: "left", offset: [-11, 0] }).setLngLat([start.lng, start.lat]).addTo(m);
  }, [start]);

  /* Route lines: straight placeholders first, then street geometry */
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    const src = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    if (!plan?.legs.length) { src.setData(empty); return; }
    const ctrl = new AbortController();
    const feats: GeoJSON.Feature[] = plan.legs.map((l) => ({
      type: "Feature",
      properties: { mode: l.mode },
      geometry: { type: "LineString", coordinates: [[l.from.lng, l.from.lat], [l.to.lng, l.to.lat]] },
    }));
    src.setData({ type: "FeatureCollection", features: feats });
    plan.legs.forEach((l, i) => {
      if (l.mode === "metro") return;
      legGeometry(l.from, l.to, l.mode, ctrl.signal).then((pts) => {
        if (ctrl.signal.aborted) return;
        feats[i] = { ...feats[i], geometry: { type: "LineString", coordinates: pts.map(([lat, lng]) => [lng, lat]) } };
        src.setData({ type: "FeatureCollection", features: [...feats] });
      });
    });
    return () => ctrl.abort();
  }, [plan, ready, styleTick]);

  /* Fit to route */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const pts: [number, number][] = [];
    if (start) pts.push([start.lng, start.lat]);
    // Frame the start and the nearest handful of pandals.
    plan?.stops.slice(0, 8).forEach((s) => pts.push([s.lng, s.lat]));
    if (pts.length < 2) return;
    const b = new maplibregl.LngLatBounds(pts[0], pts[0]);
    pts.forEach((p) => b.extend(p));
    const fit = () => {
      m.resize();
      const padding = sheetPadding();
      const cam = m.cameraForBounds(b, { padding, maxZoom: 15.5 });
      // Fall back to centring on the start if the bounds can't be framed.
      if (cam?.center) m.flyTo({ ...cam, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 900, essential: true });
      else if (start) m.flyTo({ center: [start.lng, start.lat], zoom: 14, duration: 900, essential: true });
    };
    // Wait a frame for the sheet to settle so the padding is current.
    const t = setTimeout(fit, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  /* Frame the start and the selected pandal */
  useEffect(() => {
    const m = map.current;
    const p = pandals.find((x) => x.id === focusId);
    if (!m || !p) return;
    if (start) {
      const b = new maplibregl.LngLatBounds([start.lng, start.lat], [start.lng, start.lat]).extend([p.lng, p.lat]);
      m.fitBounds(b, { padding: sheetPadding(), maxZoom: 16, duration: 700 });
    } else {
      m.easeTo({ center: [p.lng, p.lat], zoom: Math.max(m.getZoom(), 15), padding: sheetPadding(), duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  return <div ref={box} className="map" style={{ position: "absolute", inset: 0 }} />;
}
