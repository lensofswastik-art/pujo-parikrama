"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PANDALS, PANDAL_BY_ID } from "@/data/pandals";
import { ADVISORIES } from "@/data/parikramas";
import type { Mode, Pandal } from "@/data/types";
import {
  RAPIDO_LINK, SLOT_INFO, bn, buildLeg, dist, dwellFor, fmtDist, fmtMin, gmapsLink, olaLink,
  uberLink, type Leg, type Plan, type Pt, type Slot,
} from "@/lib/planner";
import Pill from "./Pill";
import SearchBar, { type Pick } from "./SearchBar";
import { IBack, IBarricade, IChevron, IFit, MODE_ICON } from "./Icons";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map map-loading" />,
});

type Start = Pt & { label: string; areaId: string | null; metro?: { station: string; walkMin: number } };
type View = "list" | "detail" | "roads";

/** "Near you" radius, and how far we'll still suggest a must-see. */
const NEARBY_M = 3000;
const ATTRACTION_M = 8000;
const MAX_NEARBY = 40;
const FIRST_SHOWN = 12;

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "smart", label: "Best mix", hint: "Walk short hops, ride the long ones" },
  { value: "walk", label: "Walk", hint: "Everything on foot" },
  { value: "metro", label: "Metro", hint: "Metro where it helps, walk the rest" },
  { value: "auto", label: "Auto / toto", hint: "Shared autos for longer hops" },
  { value: "bus", label: "Bus", hint: "Cheapest, slowest in puja traffic" },
  { value: "cab", label: "Cab / bike", hint: "Uber, Ola, Rapido — surge likely" },
];
const KOLKATA_BOX = { s: 22.35, n: 22.8, w: 88.2, e: 88.6 };

/** Time of day decides whether evening no-entry grids apply — read from the clock, not asked. */
function slotNow(): Slot {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 15) return "afternoon";
  if (h >= 15) return "evening";
  return "late";
}

export default function Planner() {
  const [start, setStart] = useState<Start | null>(null);
  const [mode, setMode] = useState<Mode>("smart");
  const [slot, setSlot] = useState<Slot>("evening");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [showZones, setShowZones] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { const s = slotNow(); setSlot(s); setShowZones(SLOT_INFO[s].restricted); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  const beginAt = useCallback((s: Start) => {
    setStart(s);
    setSelectedId(null); setView("list"); setShowAll(false);
    setFitTick((t) => t + 1);
  }, []);

  const onPick = useCallback((p: Pick) => {
    if (p.kind === "area") beginAt({ lat: p.area.lat, lng: p.area.lng, label: p.area.label, areaId: p.area.id, metro: p.area.metro });
    if (p.kind === "pandal") {
      const x = PANDAL_BY_ID[p.id];
      beginAt({ lat: x.lat, lng: x.lng, label: x.name, areaId: null, metro: x.metro });
    }
    if (p.kind === "here") {
      if (!navigator.geolocation) { setToast("This browser can't share location. Pick a station instead."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (lat < KOLKATA_BOX.s || lat > KOLKATA_BOX.n || lng < KOLKATA_BOX.w || lng > KOLKATA_BOX.e) {
            setToast("You seem to be outside Kolkata. Pick a station instead.");
            return;
          }
          beginAt({ lat, lng, label: "Your location", areaId: null });
        },
        () => setToast("Location is blocked. Allow it in your browser, or pick a station."),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, [beginAt]);

  /* ── Pandals sorted by how close they are — each one routed directly from the start ── */
  const { nearby, attractions, radius } = useMemo(() => {
    if (!start) return { nearby: [] as Pandal[], attractions: [] as Pandal[], radius: NEARBY_M };
    // Same walking-distance estimate the rows show (straight line × 1.35 for Kolkata's lanes).
    const withD = PANDALS.map((p) => ({ p, d: dist(start, p) * 1.35 })).sort((a, b) => a.d - b.d);
    // Dense paras get a 3 km circle; sparser ones (e.g. Dum Dum metro) widen to 5 km.
    const radius = withD.filter((x) => x.d <= NEARBY_M).length >= 20 ? NEARBY_M : 5000;
    const nearby = withD.filter((x) => x.d <= radius).slice(0, MAX_NEARBY).map((x) => x.p);
    const attractions = withD.filter((x) => x.p.mustSee && x.d > radius && x.d <= ATTRACTION_M && !nearby.includes(x.p)).map((x) => x.p);
    return { nearby, attractions, radius };
  }, [start]);
  const ranked = useMemo(() => [...nearby, ...attractions], [nearby, attractions]);

  const legs = useMemo(() => {
    const m = new Map<string, Leg>();
    if (start) ranked.forEach((p) => m.set(p.id, buildLeg(start, p, mode, slot)));
    return m;
  }, [start, ranked, mode, slot]);

  // Default to the nearest pandal so a route is always on the map.
  const activeId = selectedId ?? ranked[0]?.id ?? null;
  const activeLeg = activeId ? legs.get(activeId) : undefined;

  /* Map gets the ranked pandals for numbering, and only the selected route to draw. */
  const mapPlan: Plan | null = start
    ? { stops: ranked, legs: activeLeg ? [activeLeg] : [], travelMin: 0, dwellMin: 0, totalMin: 0, walkKm: 0, skipped: [] }
    : null;
  const fitKey = `${fitTick}|${start?.lat ?? ""}`;

  /* ── Bottom sheet snapping (phones) ── */
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");
  const [drag, setDrag] = useState<number | null>(null);
  const dragRef = useRef<{ y0: number; h0: number } | null>(null);
  const snapPx = useCallback((s: typeof snap) => {
    if (typeof window === "undefined") return 200;
    const vh = window.innerHeight;
    return s === "peek" ? 200 : s === "half" ? Math.round(vh * 0.5) : Math.round(vh * 0.84);
  }, []);
  const [vhTick, setVhTick] = useState(0);
  useEffect(() => { const r = () => setVhTick((t) => t + 1); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  const currentSnap = drag ?? snapPx(snap);
  useEffect(() => {
    document.documentElement.style.setProperty("--snap", `${Math.round(drag ?? snapPx(snap))}px`);
  }, [snap, drag, snapPx, vhTick]);
  useEffect(() => { if (start) setSnap((s) => (s === "peek" ? "half" : s)); }, [start]);

  const cycle = () => setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek"));
  const onGrabDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 900) return;
    if ((e.target as HTMLElement).closest("button, a, [role=listbox]")) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { y0: e.clientY, h0: currentSnap };
  };
  const onGrabMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setDrag(Math.min(window.innerHeight * 0.84, Math.max(140, dragRef.current.h0 + (dragRef.current.y0 - e.clientY))));
  };
  const onGrabUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const moved = Math.abs(e.clientY - dragRef.current.y0);
    const h = drag ?? dragRef.current.h0;
    dragRef.current = null;
    setDrag(null);
    if (moved < 6) { cycle(); return; }
    const order = (["peek", "half", "full"] as const).map((s) => [s, Math.abs(snapPx(s) - h)] as const);
    setSnap([...order].sort((a, b) => a[1] - b[1])[0][0]);
  };

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [view, start]);

  const selectPandal = (id: string) => { setSelectedId(id); if (snap === "peek") setSnap("half"); };
  const openDetail = (id: string) => { setSelectedId(id); setView("detail"); if (snap === "peek") setSnap("half"); };
  const openRoads = () => { setView("roads"); setShowZones(true); if (snap === "peek") setSnap("half"); };
  const onMapSelect = (id: string) => {
    if (start && legs.has(id)) { selectPandal(id); setView("list"); document.getElementById(`row-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
    else openDetail(id);
  };
  const detailP = view === "detail" && selectedId ? PANDAL_BY_ID[selectedId] : null;
  const restricted = SLOT_INFO[slot].restricted;
  const mustSees = useMemo(() => PANDALS.filter((p) => p.mustSee), []);

  return (
    <div className="shell">
      <div className="side">
        <header className="top">
          <SearchBar value={start?.label ?? null} activeAreaId={start?.areaId ?? null} onPick={onPick}
            onClear={() => { setStart(null); setSelectedId(null); setView("list"); setSnap("peek"); }} />
        </header>

        <section className={`sheet${drag !== null ? " dragging" : ""}${snap === "full" && drag === null ? " full" : ""}`} aria-label="Pandals near you">
          <div className="sheet-handle" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
            <button className="grab" aria-label="Resize the panel" onClick={cycle}><span /></button>
            <div className="sheet-head head-row">
              <div>
                <h2>{start ? "কাছের পুজো" : "পুজো পরিক্রমা ২০২৬"}</h2>
                <p className="sum" aria-live="polite">
                  {start
                    ? <><b>{nearby.length} pandals</b> within {radius / 1000} km of {start.label}</>
                    : <>Pick your metro station or area to see the nearest pandals and how to reach each one.</>}
                </p>
              </div>
              {start && (
                <Pill label="Getting around" value={mode} onChange={setMode}
                  options={MODES.map((m) => { const I = MODE_ICON[m.value]; return { ...m, icon: <I width={17} /> }; })} />
              )}
            </div>
          </div>

          <div className="sheet-body" ref={bodyRef}>
            {view === "roads" && <Roads onBack={() => setView("list")} />}
            {detailP && (
              <Detail p={detailP} slot={slot} start={start} leg={legs.get(detailP.id)} onBack={() => setView("list")} />
            )}
            {view === "list" && !start && (
              <div className="idle">
                <h3 className="idle-h">This year&apos;s must-sees</h3>
                <ul className="idle-list">
                  {mustSees.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => openDetail(p.id)}>
                        <span className="idle-name">{p.name}</span>
                        <span className="idle-theme">{p.theme ?? "Theme yet to be revealed"}</span>
                        <span className="idle-loc">{p.locality}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {view === "list" && start && (
              <>
                {restricted && (
                  <button className="notice" onClick={openRoads}>
                    <IBarricade width={18} />
                    <span>No-entry grids are on after 3 pm. Cabs and autos stop short; the last stretch is on foot.</span>
                    <IChevron width={14} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                )}
                {nearby.length === 0 && attractions.length === 0 && (
                  <p className="empty-line">No listed pandals within {ATTRACTION_M / 1000} km of {start.label} yet.</p>
                )}
                {nearby.length > 0 && (
                  <ol className="near">
                    {nearby.slice(0, showAll ? nearby.length : FIRST_SHOWN).map((p, i) => (
                      <PandalRow key={p.id} p={p} n={i + 1} leg={legs.get(p.id)!} open={activeId === p.id}
                        onSelect={() => selectPandal(p.id)} onDetail={() => openDetail(p.id)} />
                    ))}
                  </ol>
                )}
                {!showAll && nearby.length > FIRST_SHOWN && (
                  <button className="show-more" onClick={() => setShowAll(true)}>Show {nearby.length - FIRST_SHOWN} more nearby pandals</button>
                )}
                {attractions.length > 0 && (
                  <>
                    <h3 className="group-h">Main attractions a short ride away</h3>
                    <ol className="near" start={nearby.length + 1}>
                      {attractions.map((p, i) => (
                        <PandalRow key={p.id} p={p} n={nearby.length + i + 1} leg={legs.get(p.id)!} open={activeId === p.id}
                          onSelect={() => selectPandal(p.id)} onDetail={() => openDetail(p.id)} />
                      ))}
                    </ol>
                  </>
                )}
                <button className="link-row" onClick={openRoads}>Road closures and police advisories</button>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="map-wrap">
        <MapView pandals={PANDALS} plan={mapPlan} start={start} selectedId={activeId} focusId={selectedId} showZones={showZones} fitKey={fitKey} onSelect={onMapSelect} />
        <div className="map-tools" hidden={snap === "full"}>
          <button className="tool" aria-pressed={showZones} onClick={() => setShowZones((z) => !z)} aria-label="Show no-vehicle zones" title="No-vehicle zones">
            <IBarricade />
          </button>
          {start && <button className="tool" onClick={() => setFitTick((t) => t + 1)} aria-label="Show all nearby pandals" title="Show all nearby"><IFit /></button>}
        </div>
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}

/* ───────────────────────── Sub-views ───────────────────────── */

function Crowd({ n }: { n: number }) {
  return (
    <span className="crowd" aria-label={`Crowd ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}
    </span>
  );
}

const MODE_LABEL: Record<Leg["mode"], string> = { walk: "Walk", auto: "Auto", bus: "Bus", cab: "Cab", metro: "Metro" };

/** Plain-language "how to get there" for one pandal. */
function howTo(leg: Leg, start: Pt & { label?: string }) {
  const p = leg.to;
  const drop = leg.restricted ? p.vehicleDrop.label : p.locality;
  if (leg.mode === "walk") return `Walk ${fmtDist(leg.distM)} from ${start.label ?? "here"}.`;
  if (leg.mode === "metro") return leg.steps.slice(0, 2).join(". ") + ".";
  if (leg.mode === "bus") return `Bus from the main road${p.buses?.length ? ` (${p.buses.join(", ")})` : ""}, get off near ${drop}.`;
  if (leg.mode === "auto") return `Shared auto${p.autoStand ? ` towards ${p.autoStand}` : ` towards ${p.locality}`}, get down at ${drop}.`;
  return `Book a cab or bike to ${drop}.`;
}

function PandalRow({ p, n, leg, open, onSelect, onDetail }: {
  p: Pandal; n: number; leg: Leg; open: boolean; onSelect: () => void; onDetail: () => void;
}) {
  const Ico = MODE_ICON[leg.mode];
  const ride = leg.mode !== "walk";
  return (
    <li className={`row${open ? " open" : ""}`} id={`row-${p.id}`}>
      <button className="row-main" aria-expanded={open} onClick={onSelect}>
        <span className={`stop-num${p.mustSee ? " must" : ""}`} aria-hidden="true">{bn(n)}</span>
        <span className="row-text">
          <span className="stop-name">{p.name}</span>
          {p.theme
            ? <span className="stop-theme">{p.theme}</span>
            : <span className="stop-theme loc">{p.locality}</span>}
        </span>
        <span className="row-go">
          <b>{fmtDist(leg.distM)}</b>
          <span><Ico width={14} />{MODE_LABEL[leg.mode]} {fmtMin(leg.totalMin)}</span>
        </span>
      </button>
      {open && (
        <div className="row-more">
          <p className="how">{howTo(leg, leg.from)}</p>
          {leg.restricted && leg.mode !== "walk" && leg.mode !== "metro" && (
            <p className="how-warn">After 3 pm vehicles stop at {p.vehicleDrop.label}; walk the last {fmtDist(p.vehicleDrop.walkM)}.</p>
          )}
          <div className="leg-links">
            <a className="ride gm" href={gmapsLink(leg.from, p, leg.mode)} target="_blank" rel="noreferrer">Directions</a>
            {ride && (
              <>
                <a className="ride uber" href={uberLink(leg.from, p, p.vehicleDrop.label)} target="_blank" rel="noreferrer">Uber</a>
                <a className="ride ola" href={olaLink(leg.from, p)} target="_blank" rel="noreferrer">Ola</a>
                <a className="ride rapido" href={RAPIDO_LINK} target="_blank" rel="noreferrer">Rapido</a>
              </>
            )}
            <button className="ride more-info" onClick={onDetail}>About this pandal</button>
          </div>
        </div>
      )}
    </li>
  );
}

function Detail({ p, slot, start, leg, onBack }: { p: Pandal; slot: Slot; start: Start | null; leg?: Leg; onBack: () => void }) {
  return (
    <div className="detail">
      <button className="back" onClick={onBack}><IBack width={16} />Back</button>
      {p.nameBn && <div className="bn-big">{p.nameBn}</div>}
      <h3>{p.name}</h3>
      <p className="detail-loc">{p.locality}{start ? `, ${fmtDist(dist(start, p))} from ${start.label}` : ""}</p>
      <div className="theme-block">
        <div className="val">{p.theme ?? "Theme yet to be revealed"}</div>
        {p.themeMeaning && <div className="mean">{p.themeMeaning}</div>}
      </div>
      <dl className="facts">
        <div><dt>Crowd</dt><dd><Crowd n={p.crowd} /></dd></div>
        <div><dt>Time inside</dt><dd>~{dwellFor(p, slot)} min</dd></div>
        <div><dt>Best time</dt><dd>{p.bestTime}</dd></div>
        {p.metro ? <div><dt>Metro</dt><dd>{p.metro.station}, {p.metro.walkMin} min walk</dd></div>
          : p.rail ? <div><dt>Rail</dt><dd>{p.rail}</dd></div> : null}
        <div className="wide"><dt>Cabs and autos reach</dt><dd>{p.vehicleDrop.label}, then {fmtDist(p.vehicleDrop.walkM)} on foot after 3 pm</dd></div>
        {p.autoStand && <div className="wide"><dt>Auto stand</dt><dd>{p.autoStand}</dd></div>}
        {p.buses && <div className="wide"><dt>Buses</dt><dd>{p.buses.join(", ")}</dd></div>}
      </dl>
      {p.note && <p className="note">{p.note}</p>}
      {leg && (
        <div className="steps-box">
          <h4>Getting there from {start?.label}</h4>
          <ul className="leg-steps">{leg.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      <div className="actions">
        <a className="btn btn-primary" href={start ? gmapsLink(start, p, leg?.mode ?? "walk") : `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
    </div>
  );
}

function Roads({ onBack }: { onBack: () => void }) {
  return (
    <div className="roads">
      <button className="back" onClick={onBack}><IBack width={16} />Back</button>
      <h3 className="roads-h">Road closures</h3>
      <p className="adv-intro">Police can divert vehicles and rope off lanes at any time. Red circles on the map show where you&apos;ll likely finish on foot.</p>
      <ul className="adv">
        {ADVISORIES.map((a) => (
          <li key={a.id}>
            <h4>{a.title}</h4>
            <span className="when">{a.when}{a.status === "pattern-2025" && ", based on last year's plan"}</span>
            <p>{a.body}</p>
            <a href={a.source.url} target="_blank" rel="noreferrer">{a.source.label}</a>
          </li>
        ))}
        <li>
          <h4>Changes on the day</h4>
          <p>Check Kolkata Police&apos;s social handles before heading out.</p>
          <a href="https://kolkatapolice.gov.in/" target="_blank" rel="noreferrer">Kolkata Police</a>
        </li>
      </ul>
    </div>
  );
}
