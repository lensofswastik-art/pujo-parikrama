"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PANDALS, PANDAL_BY_ID } from "@/data/pandals";
import { ADVISORIES } from "@/data/parikramas";
import type { Mode, Pandal } from "@/data/types";
import {
  RAPIDO_LINK, SLOT_INFO, bn, dist, dwellFor, fitToBudget, fmtDist, fmtMin, gmapsLink, makePlan, olaLink,
  uberLink, type Leg, type Plan, type Pt, type Slot,
} from "@/lib/planner";
import Pill from "./Pill";
import SearchBar, { type Pick } from "./SearchBar";
import { Alpona, IBack, IBarricade, IChevron, IClock, IFit, IPlus, ISun, MODE_ICON } from "./Icons";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map map-loading" />,
});

type Start = Pt & { label: string; areaId: string | null; metro?: { station: string; walkMin: number } };
type View = "route" | "detail" | "roads";

/** How far counts as "near you", and how far we'll go for a must-see. */
const NEARBY_M = 2500;
const ATTRACTION_M = 8000;

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "smart", label: "Best mix", hint: "Walk short hops, ride the long ones" },
  { value: "walk", label: "Walk", hint: "Everything on foot" },
  { value: "metro", label: "Metro", hint: "Metro between areas, walk the rest" },
  { value: "auto", label: "Auto / toto", hint: "Shared autos for longer hops" },
  { value: "bus", label: "Bus", hint: "Cheapest, slowest in puja traffic" },
  { value: "cab", label: "Cab / bike", hint: "Uber, Ola, Rapido — surge likely" },
];
const BUDGETS = [
  { value: 120, label: "2 hrs" },
  { value: 240, label: "4 hrs" },
  { value: 360, label: "6 hrs" },
  { value: 600, label: "All night" },
];
const SLOTS: Slot[] = ["morning", "afternoon", "evening", "late"];
const KOLKATA_BOX = { s: 22.35, n: 22.8, w: 88.2, e: 88.6 };

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
  const [slot, setSlot] = useState<Slot>("morning");
  const [budget, setBudget] = useState(240);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("route");
  const [showZones, setShowZones] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);

  useEffect(() => { const s = slotNow(); setSlot(s); setShowZones(SLOT_INFO[s].restricted); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  const beginAt = useCallback((s: Start) => {
    setStart(s);
    setExcluded(new Set()); setAdded(new Set());
    setSelectedId(null); setView("route");
    setFitTick((t) => t + 1);
  }, []);

  const onPick = useCallback((p: Pick) => {
    if (p.kind === "area") beginAt({ lat: p.area.lat, lng: p.area.lng, label: p.area.label, areaId: p.area.id, metro: p.area.metro });
    if (p.kind === "pandal") {
      const x = PANDAL_BY_ID[p.id];
      beginAt({ lat: x.lat, lng: x.lng, label: x.name, areaId: null, metro: x.metro });
    }
    if (p.kind === "here") {
      if (!navigator.geolocation) { setToast("This browser can't share location. Pick an area instead."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (lat < KOLKATA_BOX.s || lat > KOLKATA_BOX.n || lng < KOLKATA_BOX.w || lng > KOLKATA_BOX.e) {
            setToast("You seem to be outside Kolkata. Pick an area instead.");
            return;
          }
          beginAt({ lat, lng, label: "Your location", areaId: null });
        },
        () => setToast("Location is blocked. Allow it in your browser, or pick an area."),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, [beginAt]);

  /* ── Plan: nearby pandals + the big attractions within reach, fitted to your time ── */
  const plan: Plan | null = useMemo(() => {
    if (!start) return null;
    let pool = PANDALS.filter((p) => {
      const d = dist(start, p);
      return d <= NEARBY_M || (p.mustSee && d <= ATTRACTION_M);
    });
    pool = pool.filter((p) => !excluded.has(p.id));
    added.forEach((id) => { if (!pool.some((p) => p.id === id)) pool.push(PANDAL_BY_ID[id]); });
    const { route, skipped } = fitToBudget(start, pool, budget, mode, slot);
    const forced = skipped.filter((p) => added.has(p.id));
    const stops = forced.length ? fitToBudget(start, [...route, ...forced], 100000, mode, slot).route : route;
    return makePlan(start, stops, mode, slot, skipped.filter((p) => !added.has(p.id)));
  }, [start, mode, slot, budget, excluded, added]);

  const fitKey = `${fitTick}|${plan?.stops.map((s) => s.id).join(",") ?? ""}`;

  const removeStop = (id: string) => {
    setExcluded((s) => new Set(s).add(id));
    setAdded((s) => { const n = new Set(s); n.delete(id); return n; });
    setSelectedId(null); setView("route");
  };
  const addStop = (id: string) => {
    setAdded((s) => new Set(s).add(id));
    setExcluded((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  /* ── Bottom sheet snapping (phones) ── */
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");
  const [drag, setDrag] = useState<number | null>(null);
  const dragRef = useRef<{ y0: number; h0: number } | null>(null);
  const snapPx = useCallback((s: typeof snap) => {
    if (typeof window === "undefined") return 200;
    const vh = window.innerHeight;
    return s === "peek" ? 200 : s === "half" ? Math.round(vh * 0.52) : Math.round(vh * 0.86);
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
    setDrag(Math.min(window.innerHeight * 0.86, Math.max(140, dragRef.current.h0 + (dragRef.current.y0 - e.clientY))));
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
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [selectedId, view, start]);

  const openPandal = (id: string) => { setSelectedId(id); setView("detail"); if (snap === "peek") setSnap("half"); };
  const openRoads = () => { setView("roads"); setSelectedId(null); setShowZones(true); if (snap === "peek") setSnap("half"); };
  const selected = selectedId ? PANDAL_BY_ID[selectedId] : null;
  const inPlan = (id: string) => !!plan?.stops.some((s) => s.id === id);
  const restricted = SLOT_INFO[slot].restricted;
  const mustSees = useMemo(() => PANDALS.filter((p) => p.mustSee), []);

  return (
    <div className="shell">
      <div className="side">
        <header className="top">
          <SearchBar value={start?.label ?? null} activeAreaId={start?.areaId ?? null} onPick={onPick}
            onClear={() => { setStart(null); setSelectedId(null); setView("route"); setSnap("peek"); }} />
        </header>

        <section className={`sheet${drag !== null ? " dragging" : ""}${snap === "full" && drag === null ? " full" : ""}`} aria-label="Pandals and route">
          <div className="sheet-handle" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
            <button className="grab" aria-label="Resize the panel" onClick={cycle}><span /></button>
            {plan ? (
              <>
                <div className="sheet-head">
                  <h2>আপনার পরিক্রমা</h2>
                  <p className="sum" aria-live="polite">
                    {plan.stops.length
                      ? <><b>{plan.stops.length} pandals</b> from {start!.label}, {fmtMin(plan.totalMin)} with queues</>
                      : <>Nothing fits yet. Give yourself more time.</>}
                  </p>
                </div>
                <div className="settings">
                  <Pill label="Getting around" value={mode} onChange={setMode}
                    options={MODES.map((m) => { const I = MODE_ICON[m.value]; return { ...m, icon: <I width={17} /> }; })} />
                  <Pill label="When you're going" value={slot} icon={<ISun width={17} />}
                    onChange={(s: Slot) => { setSlot(s); if (SLOT_INFO[s].restricted) setShowZones(true); }}
                    options={SLOTS.map((s) => ({ value: s, label: SLOT_INFO[s].label, hint: SLOT_INFO[s].hint }))} />
                  <Pill label="Time you have" value={budget} icon={<IClock width={17} />} onChange={setBudget} options={BUDGETS} />
                </div>
              </>
            ) : (
              <div className="sheet-head">
                <h2>পুজো পরিক্রমা ২০২৬</h2>
                <p className="sum">Pick your area above to see pandals near you and the best way to cover them.</p>
              </div>
            )}
          </div>

          <div className="sheet-body" ref={bodyRef}>
            {view === "roads" && <Roads onBack={() => setView("route")} />}
            {view === "detail" && selected && (
              <Detail p={selected} slot={slot} inPlan={inPlan(selected.id)} start={start} planning={!!plan}
                onBack={() => { setSelectedId(null); setView("route"); }} onAdd={() => addStop(selected.id)} onRemove={() => removeStop(selected.id)} />
            )}
            {view === "route" && !plan && (
              <div className="idle">
                <h3 className="idle-h">This year&apos;s must-sees</h3>
                <ul className="idle-list">
                  {mustSees.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => openPandal(p.id)}>
                        <span className="idle-name">{p.name}</span>
                        <span className="idle-theme">{p.theme ?? "Theme yet to be revealed"}</span>
                        <span className="idle-loc">{p.locality}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {view === "route" && plan && (
              <>
                {restricted && plan.stops.length > 0 && (
                  <button className="notice" onClick={openRoads}>
                    <IBarricade width={18} />
                    <span>No-entry grids after 3 pm. Vehicles stop short, so the last stretch is on foot.</span>
                    <IChevron width={14} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                )}
                {plan.stops.length === 0 ? (
                  <div className="empty">
                    <Alpona size={84} stroke="#1f4a44" accent="#d0121b" />
                    <h3>এখনও কিছু নেই</h3>
                    <p>Nothing fits in {fmtMin(budget)}. Choose more time from the pill above.</p>
                  </div>
                ) : (
                  <Timeline plan={plan} start={start!} slot={slot} onOpen={openPandal} onAdd={addStop} />
                )}
                <button className="link-row" onClick={openRoads}>Road closures and police advisories</button>
              </>
            )}
          </div>
        </section>
      </div>

      <div className="map-wrap">
        <MapView pandals={PANDALS} plan={plan} start={start} selectedId={selectedId} showZones={showZones} fitKey={fitKey} onSelect={openPandal} />
        <div className="map-tools" hidden={snap === "full"}>
          <button className="tool" aria-pressed={showZones} onClick={() => setShowZones((z) => !z)} aria-label="Show no-vehicle zones" title="No-vehicle zones">
            <IBarricade />
          </button>
          {plan && <button className="tool" onClick={() => setFitTick((t) => t + 1)} aria-label="Show the whole route" title="Show whole route"><IFit /></button>}
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

const MODE_LABEL: Record<Leg["mode"], string> = { walk: "Walk", auto: "Auto", bus: "Bus", cab: "Cab / bike", metro: "Metro" };

/** Where to board and where you'll be dropped, for the ride suggestion line. */
function rideHint(leg: Leg) {
  const from = leg.from as Partial<Pandal> & Pt;
  const board = from.autoStand ?? from.vehicleDrop?.label ?? "the nearest main road";
  const drop = leg.restricted ? leg.to.vehicleDrop.label : leg.to.locality;
  if (leg.mode === "bus") return `Bus from ${from.vehicleDrop?.label ?? "the nearest main road"}${leg.to.buses?.length ? ` — ${leg.to.buses.join(", ")}` : ""}, get off near ${drop}`;
  if (leg.mode === "auto") return `Auto from ${leg.to.autoStand && !from.autoStand ? leg.to.autoStand : board}, drop at ${drop}`;
  return `Book a ride to ${drop}`;
}

function LegRow({ leg }: { leg: Leg }) {
  const [open, setOpen] = useState(false);
  const Ico = MODE_ICON[leg.mode];
  const ride = leg.mode === "auto" || leg.mode === "bus" || leg.mode === "cab";
  return (
    <li className="leg" data-mode={leg.mode}>
      <div className="leg-rail" aria-hidden="true" />
      <div className="leg-body">
        <button className="leg-sum" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Ico width={17} />
          <span>{MODE_LABEL[leg.mode]} {fmtMin(leg.totalMin)}</span>
          <span className="leg-dist">{fmtDist(leg.distM)}</span>
          {leg.restricted && ride && <span className="leg-flag">ends on foot</span>}
          <IChevron width={14} className="leg-chev" />
        </button>
        {ride && (
          <div className="ride-box">
            <p className="ride-hint">{rideHint(leg)}</p>
            <div className="leg-links">
              <a className="ride uber" href={uberLink(leg.from, leg.to, leg.to.vehicleDrop.label)} target="_blank" rel="noreferrer">Uber</a>
              <a className="ride ola" href={olaLink(leg.from, leg.to)} target="_blank" rel="noreferrer">Ola</a>
              <a className="ride rapido" href={RAPIDO_LINK} target="_blank" rel="noreferrer">Rapido</a>
            </div>
          </div>
        )}
        {open && (
          <div className="leg-more">
            <ul className="leg-steps">{leg.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <div className="leg-links">
              <a className="ride" href={gmapsLink(leg.from, leg.to, leg.mode)} target="_blank" rel="noreferrer">Directions in Google Maps</a>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function Timeline({ plan, start, slot, onOpen, onAdd }: {
  plan: Plan; start: Start; slot: Slot; onOpen: (id: string) => void; onAdd: (id: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  return (
    <>
      <ol className="tl">
        <li className="tl-start"><i aria-hidden="true" />{start.label}</li>
        {plan.stops.map((p, i) => (
          <StopRow key={p.id} leg={plan.legs[i]} p={p} i={i} slot={slot} start={start} onOpen={onOpen} />
        ))}
      </ol>
      {plan.skipped.length > 0 && (
        <div className="more">
          <button className="more-btn" aria-expanded={showMore} onClick={() => setShowMore((s) => !s)}>
            <IPlus width={16} />{plan.skipped.length} more {plan.skipped.length === 1 ? "pandal" : "pandals"} around you didn&apos;t fit your time
          </button>
          {showMore && (
            <ul className="more-list">
              {plan.skipped.map((p) => (
                <li key={p.id}>
                  <span><b>{p.name}</b><small>{fmtDist(dist(start, p))} away{p.theme ? `, ${p.theme}` : ""}</small></span>
                  <button className="add" onClick={() => onAdd(p.id)} aria-label={`Add ${p.name}`}>Add</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function StopRow({ leg, p, i, slot, start, onOpen }: { leg: Leg; p: Pandal; i: number; slot: Slot; start: Start; onOpen: (id: string) => void }) {
  const near = dist(start, p) <= NEARBY_M;
  return (
    <>
      <LegRow leg={leg} />
      <li className="stop">
        <span className={`stop-num${p.mustSee ? " must" : ""}`} aria-hidden="true">{bn(i + 1)}</span>
        <button className="stop-card" onClick={() => onOpen(p.id)}>
          <span className="stop-name">{p.name}</span>
          <span className={`stop-theme${p.theme ? "" : " tba"}`}>{p.theme ?? "Theme yet to be revealed"}</span>
          <span className="stop-meta">
            {p.mustSee ? <span className="tag must">Main attraction</span> : near ? <span className="tag">Nearby</span> : null}
            ~{dwellFor(p, slot)} min here
          </span>
        </button>
      </li>
    </>
  );
}

function Detail({ p, slot, inPlan, start, planning, onBack, onAdd, onRemove }: {
  p: Pandal; slot: Slot; inPlan: boolean; start: Start | null; planning: boolean; onBack: () => void; onAdd: () => void; onRemove: () => void;
}) {
  return (
    <div className="detail">
      <button className="back" onClick={onBack}><IBack width={16} />Back</button>
      <div className="bn-big">{p.nameBn}</div>
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
      <div className="actions">
        {planning && (inPlan
          ? <button className="btn btn-ghost" onClick={onRemove}>Remove from route</button>
          : <button className="btn btn-primary" onClick={onAdd}>Add to route</button>)}
        <a className="btn btn-ghost" href={start ? gmapsLink(start, p, "walk") : `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">Google Maps</a>
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
