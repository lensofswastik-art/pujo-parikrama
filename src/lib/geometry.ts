import type { LegMode, Pt } from "./planner";

/**
 * Street-following polylines from the public FOSSGIS OSRM servers (OpenStreetMap data).
 * Foot profile for walking, car profile for everything else. Falls back to a straight
 * line if the server is slow or rate-limited, so the map never breaks.
 * For production traffic, self-host OSRM/Valhalla or use a keyed router (see README).
 */
const BASE = {
  foot: "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
  car: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
};
const cache = new Map<string, [number, number][]>();

export async function legGeometry(a: Pt, b: Pt, mode: LegMode, signal?: AbortSignal): Promise<[number, number][]> {
  const profile = mode === "walk" ? "foot" : "car";
  const key = `${profile}:${a.lat.toFixed(5)},${a.lng.toFixed(5)}>${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const straight: [number, number][] = [[a.lat, a.lng], [b.lat, b.lng]];
  try {
    const url = `${BASE[profile]}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const timeout = AbortSignal.timeout(7000);
    const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    if (!res.ok) return straight;
    const json = await res.json();
    const coords: [number, number][] | undefined = json?.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return straight;
    const line = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
    cache.set(key, line);
    return line;
  } catch {
    return straight;
  }
}
