import type { Mode, Pandal } from "@/data/types";
import { NO_VEHICLE_ZONES } from "@/data/parikramas";

export interface Pt { lat: number; lng: number; label?: string }
export type Slot = "morning" | "afternoon" | "evening" | "late";
export type LegMode = "walk" | "auto" | "bus" | "cab" | "metro";

export interface Leg {
  from: Pt;
  to: Pandal;
  distM: number;
  mode: LegMode;
  rideMin: number;
  walkMin: number;
  totalMin: number;
  restricted: boolean;
  steps: string[];
}

export interface Plan {
  stops: Pandal[];
  legs: Leg[];
  travelMin: number;
  dwellMin: number;
  totalMin: number;
  walkKm: number;
  skipped: Pandal[];
}

const R = 6371000;
export function dist(a: Pt, b: Pt) {
  const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR;
  const dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Kolkata's lanes are anything but straight — straight-line distance × 1.35 ≈ walking distance. */
const road = (a: Pt, b: Pt) => dist(a, b) * 1.35;

export const SLOT_INFO: Record<Slot, { label: string; bn: string; hint: string; crowd: number; restricted: boolean }> = {
  morning: { label: "Morning", bn: "সকাল", hint: "6 am – noon · thinnest crowds", crowd: 0.55, restricted: false },
  afternoon: { label: "Afternoon", bn: "দুপুর", hint: "Noon – 3 pm · vehicles still move", crowd: 0.8, restricted: false },
  evening: { label: "Evening", bn: "সন্ধ্যা", hint: "3 pm – midnight · no-entry grids live", crowd: 1.25, restricted: true },
  late: { label: "Late night", bn: "মাঝরাত", hint: "Midnight – 4 am · lights on, lanes clear", crowd: 0.7, restricted: true },
};

export function restrictedZoneFor(p: Pt) {
  return NO_VEHICLE_ZONES.find((z) => dist(p, z) <= z.radiusM);
}

const WALK_M_PER_MIN = 60; // ~3.6 km/h in festival crowds
const SPEED: Record<Exclude<LegMode, "walk">, { mPerMin: number; wait: number }> = {
  auto: { mPerMin: 200, wait: 6 },
  bus: { mPerMin: 150, wait: 10 },
  cab: { mPerMin: 190, wait: 9 },
  metro: { mPerMin: 550, wait: 7 },
};

function chooseMode(pref: Mode, d: number, from: Pt & { metro?: Pandal["metro"] }, to: Pandal): LegMode {
  const bothMetro = !!from.metro && !!to.metro && from.metro.station !== to.metro.station;
  switch (pref) {
    case "walk": return "walk";
    case "metro": return d > 2000 && bothMetro ? "metro" : d < 2000 ? "walk" : "auto";
    case "auto": return d < 1000 ? "walk" : "auto";
    case "bus": return d < 1200 ? "walk" : "bus";
    case "cab": return d < 1000 ? "walk" : "cab";
    default:
      if (d < 1500) return "walk";
      if (bothMetro && d > 3500) return "metro";
      if (d > 6000) return "cab";
      return "auto";
  }
}

export function buildLeg(from: Pt & { metro?: Pandal["metro"]; vehicleDrop?: Pandal["vehicleDrop"] }, to: Pandal, pref: Mode, slot: Slot): Leg {
  const d = road(from, to);
  const mode = chooseMode(pref, d, from, to);
  const restricted = SLOT_INFO[slot].restricted && !!restrictedZoneFor(to);
  const steps: string[] = [];

  if (mode === "walk") {
    const walkMin = Math.round(d / WALK_M_PER_MIN);
    steps.push(`Walk ${fmtDist(d)} to ${to.name}`);
    if (restricted) steps.push("You're inside the no-entry grid — lanes may be rope-channelled one way by police.");
    return { from, to, distM: d, mode, rideMin: 0, walkMin, totalMin: walkMin, restricted, steps };
  }

  if (mode === "metro") {
    const a = from.metro!, b = to.metro!;
    const ride = Math.round(d / SPEED.metro.mPerMin) + SPEED.metro.wait;
    const walkMin = a.walkMin + b.walkMin;
    const line = (st: string) => (st.match(/\((Yellow|Green|Purple|Orange)\)/)?.[1] ?? "Blue");
    if (a.walkMin > 0) steps.push(`Walk ${a.walkMin} min to ${a.station} metro`);
    steps.push(`Metro to ${b.station} (~${ride} min incl. wait${line(a.station) !== line(b.station) ? `; change from ${line(a.station)} to ${line(b.station)} Line` : ""})`);
    steps.push("Expect queues at metro gates on Ashtami & Navami evenings");
    steps.push(`Walk ${b.walkMin} min to ${to.name}`);
    return { from, to, distM: d, mode, rideMin: ride, walkMin, totalMin: ride + walkMin, restricted, steps };
  }

  const fromWalkM = from.vehicleDrop && SLOT_INFO[slot].restricted && restrictedZoneFor(from) ? from.vehicleDrop.walkM : 100;
  const toWalkM = restricted ? to.vehicleDrop.walkM : 120;
  const walkMin = Math.round((fromWalkM + toWalkM) / WALK_M_PER_MIN);
  const ride = Math.round(Math.max(0, d - fromWalkM - toWalkM) / SPEED[mode].mPerMin) + SPEED[mode].wait;

  if (fromWalkM > 150 && from.vehicleDrop) steps.push(`Walk ${fmtDist(fromWalkM)} out to ${from.vehicleDrop.label}`);
  if (mode === "auto") {
    steps.push(`Auto/toto towards ${to.locality}${to.autoStand ? ` — shared autos from ${to.autoStand}` : ""} (~${ride} min)`);
  } else if (mode === "bus") {
    steps.push(`Bus towards ${to.locality}${to.buses?.length ? ` — try ${to.buses.join(", ")}` : ""} (~${ride} min incl. wait)`);
  } else {
    steps.push(`Cab / bike-taxi, drop at ${restricted ? to.vehicleDrop.label : to.locality} (~${ride} min; surge likely after 7 pm)`);
  }
  steps.push(restricted
    ? `Vehicles stop at ${to.vehicleDrop.label} — walk the last ${fmtDist(to.vehicleDrop.walkM)}`
    : `Short walk to the pandal gate`);
  return { from, to, distM: d, mode, rideMin: ride, walkMin, totalMin: ride + walkMin, restricted, steps };
}

const legCost = (a: Pt, b: Pandal, pref: Mode, slot: Slot) => buildLeg(a as Pandal, b, pref, slot).totalMin;
const dwellOf = (p: Pandal, slot: Slot) => Math.round(p.dwell * SLOT_INFO[slot].crowd);

/** Nearest-neighbour seed + 2-opt — plenty for ≤ 15 stops. */
export function optimiseOrder(start: Pt, stops: Pandal[], pref: Mode, slot: Slot): Pandal[] {
  if (stops.length < 3) {
    return [...stops].sort((a, b) => road(start, a) - road(start, b));
  }
  const left = [...stops];
  const out: Pandal[] = [];
  let cur: Pt = start;
  while (left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (road(cur, left[i]) < road(cur, left[bi])) bi = i;
    cur = left[bi];
    out.push(left.splice(bi, 1)[0]);
  }
  const total = (arr: Pandal[]) => arr.reduce((s, p, i) => s + legCost(i ? arr[i - 1] : start, p, pref, slot), 0);
  let best = total(out), improved = true, guard = 0;
  while (improved && guard++ < 60) {
    improved = false;
    for (let i = 0; i < out.length - 1; i++) {
      for (let k = i + 1; k < out.length; k++) {
        const cand = [...out.slice(0, i), ...out.slice(i, k + 1).reverse(), ...out.slice(k + 1)];
        const c = total(cand);
        if (c + 0.5 < best) { best = c; out.splice(0, out.length, ...cand); improved = true; }
      }
    }
  }
  return out;
}

/**
 * Pick the most pandals that fit the time budget. Must-sees and lower-crowd pandals are
 * favoured, then cheapest-insertion keeps the walk tight (an orienteering heuristic).
 */
export function fitToBudget(start: Pt, pool: Pandal[], budgetMin: number, pref: Mode, slot: Slot) {
  // Must-sees first, then whatever is closest to where you are.
  const score = (p: Pandal) => (p.mustSee ? 3 : 1) + (p.theme ? 0.5 : 0) - dwellOf(p, slot) / 120 + Math.max(0, 1.5 - dist(start, p) / 2000);
  const ranked = [...pool].sort((a, b) => score(b) - score(a) || road(start, a) - road(start, b));
  let route: Pandal[] = [];
  const cost = (arr: Pandal[]) => arr.reduce((s, p, i) => s + legCost(i ? arr[i - 1] : start, p, pref, slot) + dwellOf(p, slot), 0);
  const skipped: Pandal[] = [];
  for (const p of ranked) {
    let best: Pandal[] | null = null, bestC = Infinity;
    for (let i = 0; i <= route.length; i++) {
      const cand = [...route.slice(0, i), p, ...route.slice(i)];
      const c = cost(cand);
      if (c < bestC) { bestC = c; best = cand; }
    }
    if (best && bestC <= budgetMin) route = best; else skipped.push(p);
  }
  return { route: optimiseOrder(start, route, pref, slot), skipped };
}

export function makePlan(start: Pt, stops: Pandal[], pref: Mode, slot: Slot, skipped: Pandal[] = []): Plan {
  const legs: Leg[] = stops.map((p, i) => buildLeg(i ? stops[i - 1] : start, p, pref, slot));
  const travelMin = legs.reduce((s, l) => s + l.totalMin, 0);
  const dwellMin = stops.reduce((s, p) => s + dwellOf(p, slot), 0);
  const walkKm = legs.reduce((s, l) => s + (l.mode === "walk" ? l.distM : l.walkMin * WALK_M_PER_MIN), 0) / 1000;
  return { stops, legs, travelMin, dwellMin, totalMin: travelMin + dwellMin, walkKm, skipped };
}

export function fmtDist(m: number) {
  return m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
export function fmtMin(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} m` : `${h} h`;
}
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[+d]);

export function dwellFor(p: Pandal, slot: Slot) { return dwellOf(p, slot); }

/* ── Deep links ─────────────────────────────────────────────── */
export function gmapsLink(a: Pt, b: Pt, mode: LegMode) {
  const tm = mode === "walk" ? "walking" : mode === "metro" || mode === "bus" ? "transit" : "driving";
  return `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=${tm}`;
}
export function uberLink(a: Pt, b: Pt, dropName: string) {
  const q = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": String(a.lat), "pickup[longitude]": String(a.lng),
    "dropoff[latitude]": String(b.lat), "dropoff[longitude]": String(b.lng),
    "dropoff[nickname]": dropName,
  });
  return `https://m.uber.com/ul/?${q.toString()}`;
}
export function olaLink(a: Pt, b: Pt) {
  return `https://book.olacabs.com/?lat=${a.lat}&lng=${a.lng}&drop_lat=${b.lat}&drop_lng=${b.lng}`;
}
export const RAPIDO_LINK = "https://www.rapido.bike/";
