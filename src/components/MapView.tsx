"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Pandal } from "@/data/types";
import { NO_VEHICLE_ZONES } from "@/data/parikramas";
import { bn, type Plan, type Pt } from "@/lib/planner";
import { legGeometry } from "@/lib/geometry";

interface Props {
  pandals: Pandal[];
  plan: Plan | null;
  start: Pt | null;
  selectedId: string | null;
  showZones: boolean;
  fitKey: string;
  onSelect: (id: string) => void;
}

const KOLKATA: [number, number] = [22.565, 88.37];

function iconFor(p: Pandal, order: number | null, selected: boolean) {
  const must = p.mustSee ? " must" : "";
  const sel = selected ? " sel" : "";
  if (order !== null) {
    return L.divIcon({
      className: "mk",
      html: `<div class="mk-num${must}${sel}"><span>${bn(order)}</span></div>`,
      iconSize: [30, 30], iconAnchor: [15, 30],
    });
  }
  return L.divIcon({ className: "mk", html: `<div class="mk-dot${must}${sel}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] });
}
const startIcon = L.divIcon({ className: "mk", html: `<div class="mk-start"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });

function FitBounds({ plan, start, fitKey }: { plan: Plan | null; start: Pt | null; fitKey: string }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    if (start) pts.push([start.lat, start.lng]);
    plan?.stops.forEach((s) => pts.push([s.lat, s.lng]));
    if (pts.length < 2) return;
    const mobile = window.innerWidth < 900;
    const snap = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--snap")) || 168;
    map.flyToBounds(L.latLngBounds(pts), {
      paddingTopLeft: [40, mobile ? 300 : 60],
      paddingBottomRight: [40, mobile ? snap + 40 : 60],
      duration: 0.8, maxZoom: 16,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return null;
}

function FlyTo({ target }: { target: Pandal | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.panTo([target.lat, target.lng], { animate: true });
  }, [target, map]);
  return null;
}

export default function MapView({ pandals, plan, start, selectedId, showZones, fitKey, onSelect }: Props) {
  const [lines, setLines] = useState<{ pts: [number, number][]; mode: string }[]>([]);

  const orderOf = useMemo(() => {
    const m = new Map<string, number>();
    plan?.stops.forEach((s, i) => m.set(s.id, i + 1));
    return m;
  }, [plan]);

  useEffect(() => {
    if (!plan || !plan.legs.length) { setLines([]); return; }
    const ctrl = new AbortController();
    // Draw straight placeholders immediately, then swap in street geometry as it arrives.
    setLines(plan.legs.map((l) => ({ pts: [[l.from.lat, l.from.lng], [l.to.lat, l.to.lng]], mode: l.mode })));
    plan.legs.forEach((l, i) => {
      if (l.mode === "metro") return;
      legGeometry(l.from, l.to, l.mode, ctrl.signal).then((pts) => {
        if (ctrl.signal.aborted) return;
        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, pts } : x)));
      });
    });
    return () => ctrl.abort();
  }, [plan]);

  const selected = pandals.find((p) => p.id === selectedId);

  return (
    <MapContainer center={KOLKATA} zoom={12} zoomControl={false} style={{ height: "100%" }} preferCanvas={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {showZones && NO_VEHICLE_ZONES.map((z) => (
        <Circle key={z.id} center={[z.lat, z.lng]} radius={z.radiusM}
          pathOptions={{ color: "#b5172b", weight: 1.5, dashArray: "5 5", fillColor: "#b5172b", fillOpacity: 0.09 }}>
          <Tooltip direction="top" className="mk-label">{z.label} · no vehicles {z.hours}</Tooltip>
        </Circle>
      ))}
      {lines.map((l, i) => (
        <Polyline key={i} positions={l.pts}
          pathOptions={
            l.mode === "walk"
              ? { color: "#d0121b", weight: 5, dashArray: "0.1 9", lineCap: "round", opacity: 0.95 }
              : l.mode === "metro"
                ? { color: "#2f7d5b", weight: 4, dashArray: "10 8", opacity: 0.9 }
                : { color: "#4a3f38", weight: 4, opacity: 0.8 }
          } />
      ))}
      {start && (
        <Marker position={[start.lat, start.lng]} icon={startIcon}>
          <Tooltip permanent direction="right" offset={[12, 0]} className="mk-label">{start.label ?? "Start"}</Tooltip>
        </Marker>
      )}
      {pandals.map((p) => {
        const order = orderOf.get(p.id) ?? null;
        return (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={iconFor(p, order, p.id === selectedId)}
            zIndexOffset={order ? 1000 : 0} eventHandlers={{ click: () => onSelect(p.id) }}
            keyboard title={p.name}>
            <Tooltip direction="top" offset={[0, order ? -30 : -8]} className="mk-label">{p.name}</Tooltip>
          </Marker>
        );
      })}
      <FitBounds plan={plan} start={start} fitKey={fitKey} />
      <FlyTo target={selected} />
    </MapContainer>
  );
}
