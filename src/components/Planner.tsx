"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PANDALS, PANDAL_BY_ID, ZONE_LABEL } from "@/data/pandals";
import { ADVISORIES, PARIKRAMAS, PLACES, PUJA_DAYS } from "@/data/parikramas";
import type { Mode, Pandal, Zone } from "@/data/types";
import {
  RAPIDO_LINK, SLOT_INFO, bn, dist, dwellFor, fitToBudget, fmtDist, fmtMin, gmapsLink, makePlan, olaLink,
  optimiseOrder, uberLink, type Leg, type Pt, type Slot,
} from "@/lib/planner";
import Combobox, { type Option } from "./Combobox";
import { Alpona, IBack, IBarricade, IClose, IFit, ILocate, IPlus, MODE_ICON } from "./Icons";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#eae6dc" }} />,
});

type Target =
  | { kind: "parikrama"; id: string }
  | { kind: "zone"; zone: Zone }
  | { kind: "pandal"; id: string }
  | { kind: "all" };

type Start = Pt & { label: string; key: string; metro?: { station: string; walkMin: number } };

const MODES: { key: Mode; label: string }[] = [
  { key: "smart", label: "Best mix" },
  { key: "walk", label: "Walk" },
  { key: "metro", label: "Metro" },
  { key: "auto", label: "Auto" },
  { key: "bus", label: "Bus" },
  { key: "cab", label: "Cab / bike" },
];
const BUDGETS = [
  { min: 120, label: "2 hrs" },
  { min: 240, label: "4 hrs" },
  { min: 360, label: "6 hrs" },
  { min: 600, label: "All night" },
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

function pujaCountdown() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const day = PUJA_DAYS.find((d) => d.date === today);
  if (day) return { big: day.bn, small: "আজ · today" };
  const ms = new Date(PUJA_DAYS[0].date).getTime() - new Date(today).getTime();
  const days = Math.round(ms / 86400000);
  if (days > 0) return { big: `${bn(days)} দিন`, small: "to Shashthi" };
  return { big: "আসছে বছর", small: "abar hobe" };
}

const startFromPlace = (i: number): Start => ({ ...PLACES[i], key: `place:${i}` });


export default function Planner() {
  const first = PARIKRAMAS[0];
  const [start, setStart] = useState<Start>({ ...first.start, key: "pk-start" });
  const [target, setTarget] = useState<Target>({ kind: "parikrama", id: first.id });
  const [mode, setMode] = useState<Mode>("smart");
  const [slot, setSlot] = useState<Slot>("morning");
  const [budget, setBudget] = useState(240);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"route" | "roads">("route");
  const [showZones, setShowZones] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<{ big: string; small: string } | null>(null);
  const [fitTick, setFitTick] = useState(0);

  useEffect(() => { setSlot(slotNow()); setCountdown(pujaCountdown()); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  /* ── Options for the two fields ── */
  const fromOptions: Option[] = useMemo(() => [
    { key: "here", group: "Quick", label: "Use my current location", icon: <ILocate width={15} /> },
    ...PLACES.map((p, i) => ({ key: `place:${i}`, group: "Stations & crossings", label: p.label })),
    ...PANDALS.map((p) => ({ key: `pandal:${p.id}`, group: "From a pandal", label: p.name, sub: p.locality, bn: p.nameBn })),
  ], []);

  const toOptions: Option[] = useMemo(() => [
    { key: "all", group: "Let us choose", label: "Best of Kolkata in my time", sub: "Must-sees that fit your hours" },
    ...PARIKRAMAS.map((r) => ({ key: `pk:${r.id}`, group: "Ready parikramas", label: r.title, sub: `${r.stops.length} pandals · ${r.hours}`, bn: r.titleBn })),
    ...(Object.keys(ZONE_LABEL) as Zone[]).map((z) => ({ key: `zone:${z}`, group: "A whole area", label: `All of ${ZONE_LABEL[z].en}`, bn: ZONE_LABEL[z].bn })),
    ...PANDALS.map((p) => ({ key: `pandal:${p.id}`, group: "One pandal (we add stops on the way)", label: p.name, sub: p.theme ?? "Theme yet to be revealed", bn: p.nameBn })),
  ], []);

  const resetEdits = () => { setExcluded(new Set()); setAdded(new Set()); };

  const pickFrom = useCallback((key: string) => {
    if (key === "here") {
      if (!navigator.geolocation) { setToast("This browser can't share location. Pick a station instead."); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (lat < KOLKATA_BOX.s || lat > KOLKATA_BOX.n || lng < KOLKATA_BOX.w || lng > KOLKATA_BOX.e) {
            setToast("You seem to be outside Kolkata — pick a starting station instead.");
            return;
          }
          setStart({ lat, lng, label: "You are here", key: "here" });
          setFitTick((t) => t + 1);
        },
        () => setToast("Location is blocked. Allow it in your browser, or pick a station."),
        { enableHighAccuracy: true, timeout: 10000 },
      );
      return;
    }
    if (key.startsWith("place:")) setStart(startFromPlace(Number(key.slice(6))));
    if (key.startsWith("pandal:")) { const p = PANDAL_BY_ID[key.slice(7)]; setStart({ lat: p.lat, lng: p.lng, label: p.name, key }); }
    setFitTick((t) => t + 1);
  }, []);

  const pickTo = useCallback((key: string) => {
    resetEdits();
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
    setTab("route");
    setFitTick((t) => t + 1);
  }, []);

  /* ── Plan ── */
  const plan = useMemo(() => {
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
      const forced = [...route, ...skipped.filter((p) => added.has(p.id))];
      const ordered = optimiseOrder(start, forced, mode, slot);
      return makePlan(start, [...ordered, dest], mode, slot, skipped.filter((p) => !added.has(p.id)));
    }
    const { route, skipped } = fitToBudget(start, pool, budget, mode, slot);
    const forcedExtra = skipped.filter((p) => added.has(p.id));
    const stops = forcedExtra.length ? optimiseOrder(start, [...route, ...forcedExtra], mode, slot) : route;
    return makePlan(start, stops, mode, slot, skipped.filter((p) => !added.has(p.id)));
  }, [target, start, mode, slot, budget, excluded, added]);

  const fitKey = `${fitTick}|${plan.stops.map((s) => s.id).join(",")}`;

  const targetLabel = (() => {
    if (target.kind === "all") return "Best of Kolkata in my time";
    if (target.kind === "parikrama") return PARIKRAMAS.find((r) => r.id === target.id)!.title;
    if (target.kind === "zone") return `All of ${ZONE_LABEL[target.zone].en}`;
    return PANDAL_BY_ID[target.id].name;
  })();

  const removeStop = (id: string) => {
    setExcluded((s) => new Set(s).add(id));
    setAdded((s) => { const n = new Set(s); n.delete(id); return n; });
  };
  const addStop = (id: string) => {
    setAdded((s) => new Set(s).add(id));
    setExcluded((s) => { const n = new Set(s); n.delete(id); return n; });
  };

  /* ── Bottom sheet snapping (mobile) ── */
  const [snap, setSnap] = useState<"peek" | "half" | "full">("peek");
  const [drag, setDrag] = useState<number | null>(null);
  const dragRef = useRef<{ y0: number; h0: number } | null>(null);
  const snapPx = useCallback((s: typeof snap) => {
    if (typeof window === "undefined") return 168;
    const vh = window.innerHeight;
    return s === "peek" ? 168 : s === "half" ? Math.round(vh * 0.5) : Math.round(vh * 0.88);
  }, []);
  const [vhTick, setVhTick] = useState(0);
  useEffect(() => { const r = () => setVhTick((t) => t + 1); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  const currentSnap = drag ?? snapPx(snap);
  useEffect(() => {
    document.documentElement.style.setProperty("--snap", `${Math.round(drag === null ? snapPx(snap) : drag)}px`);
  }, [snap, drag, snapPx, vhTick]);

  const onGrabDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 900) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { y0: e.clientY, h0: currentSnap };
  };
  const onGrabMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const h = Math.min(window.innerHeight * 0.9, Math.max(120, dragRef.current.h0 + (dragRef.current.y0 - e.clientY)));
    setDrag(h);
  };
  const onGrabUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const moved = Math.abs(e.clientY - dragRef.current.y0);
    const h = drag ?? dragRef.current.h0;
    dragRef.current = null;
    setDrag(null);
    if (moved < 6) { setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek")); return; }
    const order = (["peek", "half", "full"] as const).map((s) => [s, Math.abs(snapPx(s) - h)] as const);
    setSnap(order.sort((a, b) => a[1] - b[1])[0][0]);
  };

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [selectedId, tab]);

  const selectPandal = (id: string) => { setSelectedId(id); setTab("route"); if (snap === "peek") setSnap("half"); };
  const selected = selectedId ? PANDAL_BY_ID[selectedId] : null;
  const inPlan = (id: string) => plan.stops.some((s) => s.id === id);
  const slotInfo = SLOT_INFO[slot];
  const activePk = target.kind === "parikrama" ? target.id : null;

  return (
    <div className="shell">
      <div className="side">
        <header className="top">
          <div className="plan-card">
            <div className="brand">
              <span className="brand-mark"><Alpona /></span>
              <div>
                <div className="brand-name">পুজো পরিক্রমা</div>
                <div className="brand-sub">Kolkata pandal routes, Pujo 2026</div>
              </div>
              {countdown && <div className="countdown"><b>{countdown.big}</b>{countdown.small}</div>}
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
          <nav className="stamps" aria-label="Ready-made parikramas">
            {PARIKRAMAS.map((r, i) => (
              <button key={r.id} className="stamp" aria-pressed={activePk === r.id} onClick={() => pickTo(`pk:${r.id}`)}
                style={{ ["--tint" as string]: ["#f3e4c9", "#dfe9e4", "#f2dcdc", "#e6e2f0"][i % 4] }}>
                <span className="stamp-in">
                  <span className="t-bn">{r.titleBn}</span>
                  <span className="t-en">{r.title}</span>
                  <span className="t-meta"><span>{bn(r.stops.length)} pandals</span><span>{r.hours}</span></span>
                </span>
              </button>
            ))}
          </nav>
        </header>

        <section className={`sheet${drag !== null ? " dragging" : ""}${snap === "full" && drag === null ? " full" : ""}`} aria-label="Your parikrama">
          <div className="grab" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}
            role="button" aria-label="Resize the route panel" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek")); }}>
            <span />
          </div>
          <div className="sheet-head" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp}>
            <div className="sheet-title">
              <h2>আপনার পরিক্রমা</h2>
              <p>Your route</p>
            </div>
            {plan.stops.length > 0 ? (
              <div className="summary" aria-live="polite">
                <div><b>{plan.stops.length}</b><span>pandals</span></div>
                <div><b>{fmtMin(plan.totalMin)}</b><span>incl. queues</span></div>
                <div><b>{plan.walkKm.toFixed(1)} km</b><span>on foot</span></div>
              </div>
            ) : (
              <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--kali-3)" }}>No pandals fit yet — give yourself more time below.</p>
            )}
          </div>

          <div className="controls">
            <div className="seg" role="group" aria-label="How you'll travel">
              {MODES.map((m) => {
                const Ico = MODE_ICON[m.key];
                return (
                  <button key={m.key} className="chip" aria-pressed={mode === m.key} onClick={() => setMode(m.key)}>
                    <Ico />{m.label}
                  </button>
                );
              })}
            </div>
            <div className="ctl-row">
              <label id="lbl-slot">When</label>
              <div className="seg" role="group" aria-labelledby="lbl-slot">
                {SLOTS.map((s) => (
                  <button key={s} className="chip" aria-pressed={slot === s} onClick={() => setSlot(s)}>{SLOT_INFO[s].label}</button>
                ))}
              </div>
            </div>
            <div className={`slot-hint${slotInfo.restricted ? " warn" : ""}`}>
              {slotInfo.hint}{slotInfo.restricted ? " — we'll drop vehicles at the nearest open road and walk you in." : ""}
            </div>
            <div className="ctl-row">
              <label id="lbl-time">I have</label>
              <div className="seg" role="group" aria-labelledby="lbl-time">
                {BUDGETS.map((b) => (
                  <button key={b.min} className="chip" aria-pressed={budget === b.min} onClick={() => setBudget(b.min)}>{b.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="tabs" role="tablist">
            <button className="tab" role="tab" aria-selected={tab === "route"} onClick={() => { setTab("route"); }}>Pandals & route</button>
            <button className="tab" role="tab" aria-selected={tab === "roads"} onClick={() => { setTab("roads"); setSelectedId(null); }}>Road closures</button>
          </div>

          <div className="sheet-body" ref={bodyRef}>
            {tab === "roads" && <Roads />}
            {tab === "route" && selected && (
              <Detail p={selected} slot={slot} inPlan={inPlan(selected.id)} start={start}
                onBack={() => setSelectedId(null)} onAdd={() => addStop(selected.id)} onRemove={() => removeStop(selected.id)} />
            )}
            {tab === "route" && !selected && (
              plan.stops.length === 0 ? (
                <div className="empty">
                  <Alpona size={96} stroke="#1f4a44" accent="#d0121b" />
                  <h3>এখনও কিছু নেই</h3>
                  <p>Nothing fits in {fmtMin(budget)} from {start.label}. Pick more time, or a closer area.</p>
                </div>
              ) : (
                <Timeline plan={plan} start={start} slot={slot} onOpen={selectPandal} onRemove={removeStop} onAdd={addStop} />
              )
            )}
          </div>
        </section>
      </div>

      <div className="map-wrap">
        <MapView pandals={PANDALS} plan={plan} start={start} selectedId={selectedId} showZones={showZones} fitKey={fitKey} onSelect={selectPandal} />
        <div className="map-tools" hidden={snap === "full"}>
          <button className="tool" aria-pressed={showZones} onClick={() => setShowZones((z) => !z)} aria-label="Show no-vehicle zones" title="No-vehicle zones">
            <IBarricade />
          </button>
          <button className="tool" onClick={() => setFitTick((t) => t + 1)} aria-label="Fit the whole route" title="Fit route"><IFit /></button>
          <button className="tool" onClick={() => pickFrom("here")} aria-label="Start from my location" title="Start from my location"><ILocate /></button>
        </div>
        <div className="legend" aria-hidden="true">
          <span><i className="lg walk" />On foot</span>
          <span><i className="lg ride" />Auto / bus / cab</span>
          <span><i className="lg metro" />Metro</span>
          {showZones && <span><i className="lg zone" />No vehicles after 3 pm</span>}
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

const MODE_LABEL: Record<Leg["mode"], string> = { walk: "Walk", auto: "Auto / toto", bus: "Bus", cab: "Cab or bike-taxi", metro: "Metro" };

function LegRow({ leg }: { leg: Leg }) {
  const Ico = MODE_ICON[leg.mode];
  const dropPt = leg.to;
  return (
    <li className="leg" data-mode={leg.mode}>
      <div className="leg-rail" aria-hidden="true" />
      <div className="leg-body">
        <span className="leg-mode"><Ico />{MODE_LABEL[leg.mode]}, {fmtMin(leg.totalMin)} · {fmtDist(leg.distM)}</span>
        <ul className="leg-steps">{leg.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
        {leg.restricted && leg.mode !== "walk" && leg.mode !== "metro" && <span className="leg-flag">No-entry grid after 3 pm — last stretch on foot</span>}
        <div className="leg-links">
          <a className="ride" href={gmapsLink(leg.from, dropPt, leg.mode)} target="_blank" rel="noreferrer">
            <i className="dot" style={{ background: "#3e6e66" }} />Live directions
          </a>
          {leg.mode === "cab" && (
            <>
              <a className="ride" href={uberLink(leg.from, dropPt, leg.to.vehicleDrop.label)} target="_blank" rel="noreferrer"><i className="dot" style={{ background: "#000" }} />Uber</a>
              <a className="ride" href={olaLink(leg.from, dropPt)} target="_blank" rel="noreferrer"><i className="dot" style={{ background: "#c6d54a" }} />Ola</a>
              <a className="ride" href={RAPIDO_LINK} target="_blank" rel="noreferrer"><i className="dot" style={{ background: "#f9c70c" }} />Rapido</a>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function Timeline({ plan, start, slot, onOpen, onRemove, onAdd }: {
  plan: ReturnType<typeof makePlan>; start: Start; slot: Slot;
  onOpen: (id: string) => void; onRemove: (id: string) => void; onAdd: (id: string) => void;
}) {
  return (
    <>
      <ol className="tl">
        <li className="tl-start"><i aria-hidden="true" />{start.label}</li>
        {plan.stops.map((p, i) => (
          <FragmentStop key={p.id} leg={plan.legs[i]} p={p} i={i} slot={slot} onOpen={onOpen} onRemove={onRemove} />
        ))}
      </ol>
      {plan.skipped.length > 0 && (
        <div className="skipped">
          <b>Didn&apos;t fit in your time</b>
          <div className="add-list">
            {plan.skipped.slice(0, 10).map((p) => (
              <button key={p.id} className="chip" onClick={() => onAdd(p.id)}><IPlus />{p.name}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function FragmentStop({ leg, p, i, slot, onOpen, onRemove }: {
  leg: Leg; p: Pandal; i: number; slot: Slot; onOpen: (id: string) => void; onRemove: (id: string) => void;
}) {
  return (
    <>
      <LegRow leg={leg} />
      <li className="stop">
        <span className={`stop-num${p.mustSee ? " must" : ""}`} aria-hidden="true">{bn(i + 1)}</span>
        <div className="stop-card">
          <button className="stop-main" style={{ border: 0, background: "none", textAlign: "left", padding: 0 }} onClick={() => onOpen(p.id)}>
            <div className="stop-name">{p.name}<span className="bn">{p.nameBn}</span></div>
            <div className={`stop-theme${p.theme ? "" : " tba"}`}>{p.theme ?? "Theme yet to be revealed"}</div>
            <div className="stop-meta">
              <span>Crowd <Crowd n={p.crowd} /></span>
              <span>~{dwellFor(p, slot)} min here</span>
              {p.mustSee && <span style={{ color: "#a26c00", fontWeight: 600 }}>Must-see</span>}
            </div>
          </button>
          <button className="stop-x" onClick={() => onRemove(p.id)} aria-label={`Remove ${p.name} from route`}><IClose width={15} /></button>
        </div>
      </li>
    </>
  );
}

function Detail({ p, slot, inPlan, start, onBack, onAdd, onRemove }: {
  p: Pandal; slot: Slot; inPlan: boolean; start: Start; onBack: () => void; onAdd: () => void; onRemove: () => void;
}) {
  return (
    <div className="detail">
      <button className="back" onClick={onBack}><IBack width={16} />All stops</button>
      <h3>{p.name}</h3>
      <div className="bn-big">{p.nameBn}</div>
      <div className="theme-block">
        <div className="lbl">Theme 2026</div>
        <div className="val">{p.theme ?? "Yet to be revealed"}</div>
        {p.themeMeaning && <div className="mean">{p.themeMeaning}</div>}
      </div>
      <dl className="facts">
        <div><dt>Locality</dt><dd>{p.locality}</dd></div>
        <div><dt>Crowd</dt><dd><Crowd n={p.crowd} /></dd></div>
        <div><dt>Best time</dt><dd>{p.bestTime}</dd></div>
        <div><dt>Time inside</dt><dd>~{dwellFor(p, slot)} min ({SLOT_INFO[slot].label.toLowerCase()})</dd></div>
        {p.metro && <div><dt>Nearest metro</dt><dd>{p.metro.station}, {p.metro.walkMin} min walk</dd></div>}
        {p.rail && <div><dt>Nearest rail</dt><dd>{p.rail}</dd></div>}
        <div className="wide"><dt>Cabs & autos reach</dt><dd>{p.vehicleDrop.label} — then {fmtDist(p.vehicleDrop.walkM)} on foot after 3 pm</dd></div>
        {p.autoStand && <div><dt>Auto stand</dt><dd>{p.autoStand}</dd></div>}
        {p.buses && <div><dt>Buses</dt><dd>{p.buses.join(", ")}</dd></div>}
      </dl>
      {p.note && <p className="note">{p.note}</p>}
      <div className="actions">
        {inPlan
          ? <button className="btn btn-ghost" onClick={onRemove}><IClose width={15} />Remove from route</button>
          : <button className="btn btn-primary" onClick={onAdd}><IPlus width={15} />Add to route</button>}
        <a className="btn btn-ghost" href={gmapsLink(start, p, "walk")} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
      {p.pin === "approx" && <p className="pin-flag">Pin placed from local knowledge — the gate may be a lane away.</p>}
    </div>
  );
}

function Roads() {
  return (
    <>
      <p className="adv-intro">
        Kolkata Police can divert vehicles and rope off lanes at any time on puja days. These are this year&apos;s published arrangements — red circles on the map show where we expect you&apos;ll finish on foot.
      </p>
      <ul className="adv">
        {ADVISORIES.map((a) => (
          <li key={a.id}>
            <h4>{a.title}{a.status === "pattern-2025" && <span className="pattern">last year&apos;s plan</span>}</h4>
            <span className="when">{a.when}</span>
            <p>{a.body}</p>
            <a href={a.source.url} target="_blank" rel="noreferrer">Source: {a.source.label}</a>
          </li>
        ))}
        <li>
          <h4>Live updates</h4>
          <p>For changes on the day, follow Kolkata Traffic Police on X/Facebook or call the traffic control room before heading out.</p>
          <a href="https://kolkatapolice.gov.in/" target="_blank" rel="noreferrer">Kolkata Police</a>
        </li>
      </ul>
    </>
  );
}
