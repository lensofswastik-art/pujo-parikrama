"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PANDALS, PANDAL_BY_ID, ZONE_LABEL } from "@/data/pandals";
import { ADVISORIES, PARIKRAMAS, PLACES, PUJA_DAYS } from "@/data/parikramas";
import type { Mode, Pandal, Zone } from "@/data/types";
import {
  RAPIDO_LINK, SLOT_INFO, bn, dist, dwellFor, fitToBudget, fmtDist, fmtMin, gmapsLink, makePlan, olaLink,
  optimiseOrder, uberLink, type Leg, type Plan, type Pt, type Slot,
} from "@/lib/planner";
import Combobox, { type Option } from "./Combobox";
import Pill from "./Pill";
import { Alpona, IBack, IBarricade, IChevron, IClock, IClose, IEdit, IFit, ILocate, IPlus, ISun, MODE_ICON } from "./Icons";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="map map-loading" />,
});

type Target =
  | { kind: "parikrama"; id: string }
  | { kind: "zone"; zone: Zone }
  | { kind: "pandal"; id: string }
  | { kind: "all" };

type Start = Pt & { label: string; key: string; metro?: { station: string; walkMin: number } };
type View = "route" | "detail" | "roads";

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
const STAMP_TINTS = ["#f3e4c9", "#dfe9e4", "#f2dcdc", "#e6e2f0"];

function slotNow(): Slot {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 15) return "afternoon";
  if (h >= 15) return "evening";
  return "late";
}

function pujaCountdown() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const day = PUJA_DAYS.find((d) => d.date === today);
  if (day) return `আজ ${day.bn}`;
  const days = Math.round((new Date(PUJA_DAYS[0].date).getTime() - new Date(today).getTime()) / 86400000);
  if (days > 0) return `ষষ্ঠী আর ${bn(days)} দিন`;
  return "আসছে বছর আবার হবে";
}

export default function Planner() {
  const first = PARIKRAMAS[0];
  const [start, setStart] = useState<Start>({ ...first.start, key: "pk-start" });
  const [target, setTarget] = useState<Target>({ kind: "parikrama", id: first.id });
  const [mode, setMode] = useState<Mode>(first.bestMode);
  const [slot, setSlot] = useState<Slot>("morning");
  const [budget, setBudget] = useState(240);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("route");
  const [editing, setEditing] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [fitTick, setFitTick] = useState(0);

  useEffect(() => {
    const s = slotNow();
    setSlot(s);
    setShowZones(SLOT_INFO[s].restricted);
    setCountdown(pujaCountdown());
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  /* ── Field options ── */
  const fromOptions: Option[] = useMemo(() => [
    { key: "here", group: "Quick", label: "Use my current location", icon: <ILocate width={15} /> },
    ...PLACES.map((p, i) => ({ key: `place:${i}`, group: "Stations & crossings", label: p.label })),
    ...PANDALS.map((p) => ({ key: `pandal:${p.id}`, group: "A pandal", label: p.name, sub: p.locality, bn: p.nameBn })),
  ], []);

  const toOptions: Option[] = useMemo(() => [
    { key: "all", group: "Let us choose", label: "Best of Kolkata in my time", sub: "Must-sees that fit your hours" },
    ...PARIKRAMAS.map((r) => ({ key: `pk:${r.id}`, group: "Ready parikramas", label: r.title, sub: `${r.stops.length} pandals, ${r.hours}`, bn: r.titleBn })),
    ...(Object.keys(ZONE_LABEL) as Zone[]).map((z) => ({ key: `zone:${z}`, group: "A whole area", label: `All of ${ZONE_LABEL[z].en}`, bn: ZONE_LABEL[z].bn })),
    ...PANDALS.map((p) => ({ key: `pandal:${p.id}`, group: "One pandal, with stops on the way", label: p.name, sub: p.theme ?? "Theme yet to be revealed", bn: p.nameBn })),
  ], []);

  const pickFrom = useCallback((key: string) => {
    if (key === "here") {
      if (!navigator.geolocation) { setToast("This browser can't share location. Pick a station instead."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (lat < KOLKATA_BOX.s || lat > KOLKATA_BOX.n || lng < KOLKATA_BOX.w || lng > KOLKATA_BOX.e) {
            setToast("You seem to be outside Kolkata. Pick a starting station instead.");
            return;
          }
          setStart({ lat, lng, label: "Your location", key: "here" });
          setFitTick((t) => t + 1);
        },
        () => setToast("Location is blocked. Allow it in your browser, or pick a station."),
        { enableHighAccuracy: true, timeout: 10000 },
      );
      return;
    }
    if (key.startsWith("place:")) { const i = Number(key.slice(6)); setStart({ ...PLACES[i], key }); }
    if (key.startsWith("pandal:")) { const p = PANDAL_BY_ID[key.slice(7)]; setStart({ lat: p.lat, lng: p.lng, label: p.name, key, metro: p.metro }); }
    setFitTick((t) => t + 1);
  }, []);

  const pickTo = useCallback((key: string) => {
    setExcluded(new Set()); setAdded(new Set());
    if (key === "all") setTarget({ kind: "all" });
    if (key.startsWith("pk:")) {
      const r = PARIKRAMAS.find((x) => x.id === key.slice(3))!;
      setTarget({ kind: "parikrama", id: r.id });
      setStart({ ...r.start, key: "pk-start" });
      setMode(r.bestMode);
    }
    if (key.startsWith("zone:")) setTarget({ kind: "zone", zone: key.slice(5) as Zone });
    if (key.startsWith("pandal:")) setTarget({ kind: "pandal", id: key.slice(7) });
    setSelectedId(null);
    setView("route");
    setEditing(false);
    setFitTick((t) => t + 1);
  }, []);

  /* ── Plan ── */
  const plan: Plan = useMemo(() => {
    let pool: Pandal[] = [];
    let dest: Pandal | null = null;
    if (target.kind === "parikrama") pool = PARIKRAMAS.find((r) => r.id === target.id)!.stops.map((id) => PANDAL_BY_ID[id]);
    if (target.kind === "zone") pool = PANDALS.filter((p) => p.zone === target.zone);
    if (target.kind === "all") pool = PANDALS.filter((p) => p.mustSee);
    if (target.kind === "pandal") {
      dest = PANDAL_BY_ID[target.id];
      const direct = dist(start, dest);
      pool = PANDALS.filter((p) => p.id !== dest!.id && dist(start, p) + dist(p, dest!) - direct < 1800);
    }
    pool = pool.filter((p) => !excluded.has(p.id));
    added.forEach((id) => { if (!pool.some((p) => p.id === id) && id !== dest?.id) pool.push(PANDAL_BY_ID[id]); });

    if (dest) {
      const destCost = makePlan(start, [dest], mode, slot).totalMin;
      const { route, skipped } = fitToBudget(start, pool, Math.max(0, budget - destCost), mode, slot);
      const ordered = optimiseOrder(start, [...route, ...skipped.filter((p) => added.has(p.id))], mode, slot);
      return makePlan(start, [...ordered, dest], mode, slot, skipped.filter((p) => !added.has(p.id)));
    }
    const { route, skipped } = fitToBudget(start, pool, budget, mode, slot);
    const forced = skipped.filter((p) => added.has(p.id));
    const stops = forced.length ? optimiseOrder(start, [...route, ...forced], mode, slot) : route;
    return makePlan(start, stops, mode, slot, skipped.filter((p) => !added.has(p.id)));
  }, [target, start, mode, slot, budget, excluded, added]);

  const fitKey = `${fitTick}|${plan.stops.map((s) => s.id).join(",")}`;

  const targetLabel = (() => {
    if (target.kind === "all") return "Best of Kolkata";
    if (target.kind === "parikrama") return PARIKRAMAS.find((r) => r.id === target.id)!.title;
    if (target.kind === "zone") return `All of ${ZONE_LABEL[target.zone].en}`;
    return PANDAL_BY_ID[target.id].name;
  })();

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
    return s === "peek" ? 200 : s === "half" ? Math.round(vh * 0.52) : Math.round(vh * 0.9);
  }, []);
  const [vhTick, setVhTick] = useState(0);
  useEffect(() => { const r = () => setVhTick((t) => t + 1); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  const currentSnap = drag ?? snapPx(snap);
  useEffect(() => {
    document.documentElement.style.setProperty("--snap", `${Math.round(drag ?? snapPx(snap))}px`);
  }, [snap, drag, snapPx, vhTick]);

  const cycle = () => setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek"));
  const onGrabDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 900) return;
    if ((e.target as HTMLElement).closest("button, a, [role=listbox]")) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = { y0: e.clientY, h0: currentSnap };
  };
  const onGrabMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setDrag(Math.min(window.innerHeight * 0.9, Math.max(140, dragRef.current.h0 + (dragRef.current.y0 - e.clientY))));
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
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [selectedId, view]);

  const openPandal = (id: string) => {
    setSelectedId(id); setView("detail");
    if (snap === "peek") setSnap("half");
  };
  const openRoads = () => { setView("roads"); setSelectedId(null); setShowZones(true); if (snap === "peek") setSnap("half"); };
  const selected = selectedId ? PANDAL_BY_ID[selectedId] : null;
  const inPlan = (id: string) => plan.stops.some((s) => s.id === id);
  const restricted = SLOT_INFO[slot].restricted;
  const activePk = target.kind === "parikrama" ? target.id : null;
  const activeZone = target.kind === "zone" ? target.zone : null;

  return (
    <div className="shell">
      <div className="side">
        {/* ── Trip bar ── */}
        <header className="top">
          <button className="trip" onClick={() => setEditing(true)} aria-label={`Edit trip: from ${start.label} through ${targetLabel}`}>
            <span className="trip-mark"><Alpona size={30} /></span>
            <span className="trip-text">
              <span className="trip-from">{start.label}</span>
              <span className="trip-to">{targetLabel}</span>
            </span>
            <span className="trip-edit"><IEdit width={18} /></span>
          </button>
        </header>

        {/* ── Route sheet ── */}
        <section className={`sheet${drag !== null ? " dragging" : ""}${snap === "full" && drag === null ? " full" : ""}`} aria-label="Your parikrama">
          <div className="sheet-handle" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
            <button className="grab" aria-label="Resize the route panel" onClick={cycle}><span /></button>
            <div className="sheet-head">
              <div>
                <h2>আপনার পরিক্রমা</h2>
                <p className="sum" aria-live="polite">
                  {plan.stops.length
                    ? <><b>{plan.stops.length} pandals</b> in {fmtMin(plan.totalMin)}, {plan.walkKm.toFixed(1)} km on foot</>
                    : <>Nothing fits yet. Give yourself more time.</>}
                </p>
              </div>
            </div>
            <div className="settings">
              <Pill label="Getting around" value={mode} onChange={setMode}
                options={MODES.map((m) => { const I = MODE_ICON[m.value]; return { ...m, icon: <I width={17} /> }; })} />
              <Pill label="When you're going" value={slot} icon={<ISun width={17} />}
                onChange={(s: Slot) => { setSlot(s); if (SLOT_INFO[s].restricted) setShowZones(true); }}
                options={SLOTS.map((s) => ({ value: s, label: SLOT_INFO[s].label, hint: SLOT_INFO[s].hint }))} />
              <Pill label="Time you have" value={budget} icon={<IClock width={17} />} onChange={setBudget} options={BUDGETS} />
            </div>
          </div>

          <div className="sheet-body" ref={bodyRef}>
            {view === "roads" && <Roads onBack={() => setView("route")} />}
            {view === "detail" && selected && (
              <Detail p={selected} slot={slot} inPlan={inPlan(selected.id)} start={start}
                onBack={() => { setSelectedId(null); setView("route"); }} onAdd={() => addStop(selected.id)} onRemove={() => removeStop(selected.id)} />
            )}
            {view === "route" && (
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
                    <p>Nothing fits in {fmtMin(budget)} from {start.label}. Choose more time, or a closer area.</p>
                  </div>
                ) : (
                  <Timeline plan={plan} start={start} slot={slot} onOpen={openPandal} onAdd={addStop} />
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
          <button className="tool" onClick={() => setFitTick((t) => t + 1)} aria-label="Show the whole route" title="Show whole route"><IFit /></button>
          <button className="tool" onClick={() => pickFrom("here")} aria-label="Start from my location" title="Start from my location"><ILocate /></button>
        </div>
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>

      {/* ── Trip editor ── */}
      {editing && (
        <div className="editor" role="dialog" aria-modal="true" aria-label="Plan your parikrama">
          <div className="editor-top">
            <div className="editor-brand">
              <Alpona size={34} />
              <div>
                <div className="brand-name">পুজো পরিক্রমা</div>
                <div className="brand-sub">{countdown}</div>
              </div>
              <button className="editor-close" onClick={() => setEditing(false)} aria-label="Close"><IClose width={20} /></button>
            </div>
            <div className="od">
              <span className="od-rail" aria-hidden="true" />
              <Combobox pin="from" label="Setting out from" value={start.label} placeholder="Your location, a station or a pandal"
                options={fromOptions} searchPlaceholder="Search a station, crossing or pandal" onPick={pickFrom} />
              <Combobox pin="to" label="Take me through" value={targetLabel} placeholder="A parikrama, an area or one pandal"
                options={toOptions} searchPlaceholder="Search parikramas, areas or pandals" onPick={pickTo} />
            </div>
            <div className="paar" aria-hidden="true" />
          </div>
          <div className="editor-body">
            <h3 className="editor-h">Ready parikramas</h3>
            <div className="stamps">
              {PARIKRAMAS.map((r, i) => (
                <button key={r.id} className="stamp" aria-pressed={activePk === r.id} onClick={() => pickTo(`pk:${r.id}`)}
                  style={{ ["--tint" as string]: STAMP_TINTS[i % 4] }}>
                  <span className="stamp-in">
                    <span className="t-bn">{r.titleBn}</span>
                    <span className="t-en">{r.title}</span>
                    <span className="t-meta"><span>{bn(r.stops.length)} pandals</span><span>{r.hours}</span></span>
                  </span>
                </button>
              ))}
            </div>
            <h3 className="editor-h">Or a whole area</h3>
            <div className="areas">
              {(Object.keys(ZONE_LABEL) as Zone[]).map((z) => (
                <button key={z} className="area" aria-pressed={activeZone === z} onClick={() => pickTo(`zone:${z}`)}>
                  <span className="area-bn">{ZONE_LABEL[z].bn}</span>{ZONE_LABEL[z].en}
                </button>
              ))}
              <button className="area" aria-pressed={target.kind === "all"} onClick={() => pickTo("all")}>
                <span className="area-bn">সেরা</span>Best of Kolkata
              </button>
            </div>
          </div>
        </div>
      )}
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

function LegRow({ leg }: { leg: Leg }) {
  const [open, setOpen] = useState(false);
  const Ico = MODE_ICON[leg.mode];
  const showFlag = leg.restricted && leg.mode !== "walk" && leg.mode !== "metro";
  return (
    <li className="leg" data-mode={leg.mode}>
      <div className="leg-rail" aria-hidden="true" />
      <div className="leg-body">
        <button className="leg-sum" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Ico width={17} />
          <span>{MODE_LABEL[leg.mode]} {fmtMin(leg.totalMin)}</span>
          <span className="leg-dist">{fmtDist(leg.distM)}</span>
          {showFlag && <span className="leg-flag">ends on foot</span>}
          <IChevron width={14} className="leg-chev" />
        </button>
        {open && (
          <div className="leg-more">
            <ul className="leg-steps">{leg.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <div className="leg-links">
              <a className="ride" href={gmapsLink(leg.from, leg.to, leg.mode)} target="_blank" rel="noreferrer">Google Maps</a>
              {leg.mode === "cab" && (
                <>
                  <a className="ride" href={uberLink(leg.from, leg.to, leg.to.vehicleDrop.label)} target="_blank" rel="noreferrer">Uber</a>
                  <a className="ride" href={olaLink(leg.from, leg.to)} target="_blank" rel="noreferrer">Ola</a>
                  <a className="ride" href={RAPIDO_LINK} target="_blank" rel="noreferrer">Rapido</a>
                </>
              )}
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
          <StopRow key={p.id} leg={plan.legs[i]} p={p} i={i} slot={slot} onOpen={onOpen} />
        ))}
      </ol>
      {plan.skipped.length > 0 && (
        <div className="more">
          <button className="more-btn" aria-expanded={showMore} onClick={() => setShowMore((s) => !s)}>
            <IPlus width={16} />{plan.skipped.length} more {plan.skipped.length === 1 ? "pandal" : "pandals"} didn&apos;t fit your time
          </button>
          {showMore && (
            <ul className="more-list">
              {plan.skipped.map((p) => (
                <li key={p.id}>
                  <span><b>{p.name}</b>{p.theme && <small>{p.theme}</small>}</span>
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

function StopRow({ leg, p, i, slot, onOpen }: { leg: Leg; p: Pandal; i: number; slot: Slot; onOpen: (id: string) => void }) {
  return (
    <>
      <LegRow leg={leg} />
      <li className="stop">
        <span className={`stop-num${p.mustSee ? " must" : ""}`} aria-hidden="true">{bn(i + 1)}</span>
        <button className="stop-card" onClick={() => onOpen(p.id)}>
          <span className="stop-name">{p.name}</span>
          <span className={`stop-theme${p.theme ? "" : " tba"}`}>{p.theme ?? "Theme yet to be revealed"}</span>
          <span className="stop-meta">~{dwellFor(p, slot)} min here{p.mustSee ? ", must-see" : ""}</span>
        </button>
      </li>
    </>
  );
}

function Detail({ p, slot, inPlan, start, onBack, onAdd, onRemove }: {
  p: Pandal; slot: Slot; inPlan: boolean; start: Start; onBack: () => void; onAdd: () => void; onRemove: () => void;
}) {
  return (
    <div className="detail">
      <button className="back" onClick={onBack}><IBack width={16} />Back to route</button>
      <div className="bn-big">{p.nameBn}</div>
      <h3>{p.name}</h3>
      <p className="detail-loc">{p.locality}</p>
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
        {p.buses && <div className="wide"><dt>Buses</dt><dd>{p.buses.join(", ")}</dd></div>}
      </dl>
      {p.note && <p className="note">{p.note}</p>}
      <div className="actions">
        {inPlan
          ? <button className="btn btn-ghost" onClick={onRemove}>Remove from route</button>
          : <button className="btn btn-primary" onClick={onAdd}>Add to route</button>}
        <a className="btn btn-ghost" href={gmapsLink(start, p, "walk")} target="_blank" rel="noreferrer">Google Maps</a>
      </div>
    </div>
  );
}

function Roads({ onBack }: { onBack: () => void }) {
  return (
    <div className="roads">
      <button className="back" onClick={onBack}><IBack width={16} />Back to route</button>
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
