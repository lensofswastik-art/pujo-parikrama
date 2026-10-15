"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { Divider } from "@astryxdesign/core/Divider";
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@astryxdesign/core/DropdownMenu";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Link } from "@astryxdesign/core/Link";
import { List, ListItem } from "@astryxdesign/core/List";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { ToggleButton } from "@astryxdesign/core/ToggleButton";
import { VStack } from "@astryxdesign/core/VStack";
import { pujoTheme } from "@/theme/pujo";
import { PANDALS, PANDAL_BY_ID } from "@/data/pandals";
import { ADVISORIES } from "@/data/parikramas";
import type { Mode, Pandal } from "@/data/types";
import {
  RAPIDO_LINK, SLOT_INFO, bn, buildLeg, dist, dwellFor, fmtDist, fmtMin, gmapsLink, olaLink,
  uberLink, type Leg, type Plan, type Pt, type Slot,
} from "@/lib/planner";
import SearchBar, { type Pick } from "./SearchBar";
import { IBarricade, IFit, IGear, IMoon, ISunIcon, MODE_ICON } from "./Icons";
import type { MapTheme } from "./MapView";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

type Start = Pt & { label: string; areaId: string | null; metro?: { station: string; walkMin: number } };
type View = "list" | "detail" | "roads";

/** "Near you" radius, how far a must-see may be, and list sizes. */
const MAKER_URL = "https://www.linkedin.com/in/swastik-bose007";
const NEARBY_M = 3000;
const ATTRACTION_M = 8000;
const MAX_NEARBY = 40;
const FIRST_SHOWN = 12;

const MODES: { value: Mode; label: string; description: string }[] = [
  { value: "smart", label: "Best mix", description: "Walk short hops, ride the long ones" },
  { value: "walk", label: "Walk", description: "Everything on foot" },
  { value: "metro", label: "Metro", description: "Metro where it helps, walk the rest" },
  { value: "auto", label: "Auto / toto", description: "Shared autos for longer hops" },
  { value: "bus", label: "Bus", description: "Cheapest, slowest in puja traffic" },
  { value: "cab", label: "Cab / bike", description: "Uber, Ola, Rapido — surge likely" },
];
const MODE_LABEL: Record<Leg["mode"], string> = { walk: "Walk", auto: "Auto", bus: "Bus", cab: "Cab", metro: "Metro" };
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
  return (
    <Theme theme={pujoTheme} mode="dark">
      <App />
    </Theme>
  );
}

function App() {
  const [start, setStart] = useState<Start | null>(null);
  const [category, setCategory] = useState<"metro" | "area">("metro");
  const [mode, setMode] = useState<Mode>("smart");
  const [slot, setSlot] = useState<Slot>("evening");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [showZones, setShowZones] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fitTick, setFitTick] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [mapTheme, setMapThemeState] = useState<MapTheme>("light");
  useEffect(() => {
    try { const v = localStorage.getItem("pujo-map-theme"); if (v === "light" || v === "dark") setMapThemeState(v); } catch { /* storage unavailable */ }
  }, []);
  const setMapTheme = (v: MapTheme) => {
    setMapThemeState(v);
    try { localStorage.setItem("pujo-map-theme", v); } catch { /* storage unavailable */ }
  };

  useEffect(() => { const s = slotNow(); setSlot(s); setShowZones(SLOT_INFO[s].restricted); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4200); return () => clearTimeout(t); }, [toast]);

  const beginAt = useCallback((s: Start) => {
    setStart(s);
    if (s.areaId) setCategory(s.areaId.startsWith("m-") ? "metro" : "area");
    // Phones: drop the sheet to its peek so the map takes focus as it flies there.
    if (typeof window !== "undefined" && window.innerWidth < 900) setSnap("peek");
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

  /* ── Pandals nearest first — each routed directly from the start ── */
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

  const activeId = selectedId ?? ranked[0]?.id ?? null;
  const activeLeg = activeId ? legs.get(activeId) : undefined;
  const activeP = activeId ? PANDAL_BY_ID[activeId] : null;

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

  const cycle = () => setSnap((s) => (s === "peek" ? "half" : s === "half" ? "full" : "peek"));
  const onGrabDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 900) return;
    if ((e.target as HTMLElement).closest("button, a, [role=listbox], [role=combobox]")) return;
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

  const bodyRef = useRef<HTMLElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [view, start]);

  const selectPandal = (id: string) => { setSelectedId(id); setView("list"); if (snap === "peek") setSnap("half"); bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" }); };
  const openDetail = (id: string) => { setSelectedId(id); setView("detail"); if (snap === "peek") setSnap("half"); };
  const openRoads = () => { setView("roads"); setShowZones(true); if (snap === "peek") setSnap("half"); };
  const onMapSelect = (id: string) => (start && legs.has(id) ? selectPandal(id) : openDetail(id));
  const restricted = SLOT_INFO[slot].restricted;
  const mustSees = useMemo(() => PANDALS.filter((p) => p.mustSee), []);
  const shownNearby = nearby.slice(0, showAll ? nearby.length : FIRST_SHOWN);

  return (
    <VStack className="shell">
      <VStack className="side">
        <VStack as="header" className="top">
          <SearchBar value={start?.label ?? null} activeAreaId={start?.areaId ?? null}
            category={category} onCategoryChange={setCategory} onPick={onPick}
            onClear={() => { setStart(null); setSelectedId(null); setView("list"); setSnap("peek"); }} />
        </VStack>

        <VStack as="section" aria-label="Pandals near you"
          className={`sheet${drag !== null ? " dragging" : ""}${snap === "full" && drag === null ? " full" : ""}`}>
          <VStack className="sheet-handle" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabUp} onPointerCancel={onGrabUp}>
            <Center className="grab" role="button" tabIndex={0} aria-label="Resize the panel" onClick={cycle}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") cycle(); }}>
              <Center className="grab-bar">{null}</Center>
            </Center>
            <VStack gap={3} paddingInline={4} paddingBlockStart={1} paddingBlockEnd={4}>
              <VStack gap={1}>
                <HStack justify="between" align="center" gap={2}>
                  <Heading level={2} type="bangla">{start ? "কাছের পুজো" : "পুজো পরিক্রমা ২০২৬"}</Heading>
                  <Text type="supporting" size="xsm" className="maker-tag">
                    Made by <Link href={MAKER_URL} isExternalLink>Swastik</Link>
                  </Text>
                </HStack>
                <Text type="supporting" aria-live="polite">
                  {start
                    ? `${nearby.length} pandals within ${radius / 1000} km of ${start.label}`
                    : "Pick a metro station or area to see the nearest pandals."}
                </Text>
              </VStack>
              {start && (
                <HStack>
                  <Selector label="Getting around" isLabelHidden size="sm" value={mode}
                    onChange={(v) => v && setMode(v as Mode)} presentation="adaptive"
                    options={MODES.map((m) => {
                      const I = MODE_ICON[m.value];
                      return { value: m.value, label: m.label, description: m.description, icon: <Icon icon={I} /> };
                    })} />
                </HStack>
              )}
            </VStack>
            <Divider />
          </VStack>

          <VStack ref={bodyRef} isScrollable className="sheet-body" gap={6} paddingBlock={5} paddingInline={4}>
            {view === "roads" && <Roads onBack={() => setView("list")} />}

            {view === "detail" && selectedId && (
              <Detail p={PANDAL_BY_ID[selectedId]} slot={slot} start={start} leg={legs.get(selectedId)} onBack={() => setView("list")} />
            )}

            {view === "list" && !start && (
              <List header={<Heading level={3}>This year&apos;s must-sees</Heading>} hasDividers>
                {mustSees.map((p) => (
                  <ListItem key={p.id} label={p.name} description={p.locality}
                    onClick={() => openDetail(p.id)} endContent={<Icon icon="chevronRight" color="secondary" />} />
                ))}
              </List>
            )}

            {view === "list" && start && (
              <>
                {restricted && (
                  <Banner status="warning" title="No-entry grids after 3 pm" collapsible={false}
                    description={<>Cabs and autos stop short; the last stretch is on foot. <Link href="#" onClick={(e) => { e.preventDefault(); openRoads(); }}>See closures</Link></>} />
                )}

                {activeP && activeLeg && (
                  <RouteCard p={activeP} leg={activeLeg} n={ranked.indexOf(activeP) + 1} onDetail={() => openDetail(activeP.id)} />
                )}

                {ranked.length === 0 && (
                  <EmptyState title="No pandals listed nearby" isCompact
                    description={`Nothing within ${ATTRACTION_M / 1000} km of ${start.label} yet. Try a nearby station.`} />
                )}

                {nearby.length > 0 && (
                  <List hasDividers density="balanced">
                    {shownNearby.map((p, i) => (
                      <PandalRow key={p.id} p={p} n={i + 1} leg={legs.get(p.id)!} isSelected={activeId === p.id} onSelect={() => selectPandal(p.id)} />
                    ))}
                  </List>
                )}
                {!showAll && nearby.length > FIRST_SHOWN && (
                  <Button label={`Show ${nearby.length - FIRST_SHOWN} more nearby pandals`} variant="secondary" width="100%" onClick={() => setShowAll(true)} />
                )}

                {attractions.length > 0 && (
                  <List hasDividers header={<Heading level={3}>Main attractions a short ride away</Heading>}>
                    {attractions.map((p, i) => (
                      <PandalRow key={p.id} p={p} n={nearby.length + i + 1} leg={legs.get(p.id)!} isSelected={activeId === p.id} onSelect={() => selectPandal(p.id)} />
                    ))}
                  </List>
                )}

                <Button label="Road closures and police advisories" variant="ghost" width="100%" onClick={openRoads} />
              </>
            )}
          </VStack>
        </VStack>
      </VStack>

      <VStack className="map-wrap">
        <MapView pandals={PANDALS} plan={mapPlan} start={start} selectedId={activeId} focusId={selectedId} showZones={showZones} areaRadiusM={600} mapTheme={mapTheme} fitKey={fitKey} onSelect={onMapSelect} />
        <VStack gap={2} className="map-tools" hidden={snap === "full"}>
          <DropdownMenu placement="start" alignment="end" menuWidth={220}
            renderTrigger={(props) => (
              <IconButton {...props} label="Map settings" icon={<Icon icon={IGear} />} elevation="med" size="lg" />
            )}>
            <DropdownMenuRadioGroup label="Map style" value={mapTheme} onChange={(v) => setMapTheme(v as MapTheme)}>
              <DropdownMenuRadioItem value="light" label="Light map" description="Best street detail" icon={ISunIcon} />
              <DropdownMenuRadioItem value="dark" label="Dark map" description="Easier on the eyes at night" icon={IMoon} />
            </DropdownMenuRadioGroup>
          </DropdownMenu>
          <ToggleButton label="No-vehicle zones" isIconOnly icon={<Icon icon={IBarricade} />} elevation="med" size="lg"
            isPressed={showZones} onPressedChange={setShowZones} />
          {start && (
            <IconButton label="Show all nearby pandals" icon={<Icon icon={IFit} />} elevation="med" size="lg" onClick={() => setFitTick((t) => t + 1)} />
          )}
        </VStack>
        {toast && (
          <VStack className="toast">
            <Banner status="warning" title={toast} elevation="high" isDismissable onDismiss={() => setToast(null)} />
          </VStack>
        )}
      </VStack>
    </VStack>
  );
}

/* ───────────────────────── Parts ───────────────────────── */

function Num({ n, must }: { n: number; must?: boolean }) {
  return (
    <Center className={`num${must ? " must" : ""}`} aria-hidden="true">
      <Text type="label" weight="semibold">{bn(n)}</Text>
    </Center>
  );
}

function PandalRow({ p, n, leg, isSelected, onSelect }: { p: Pandal; n: number; leg: Leg; isSelected: boolean; onSelect: () => void }) {
  return (
    <ListItem
      label={p.name}
      description={p.locality}
      startContent={<Num n={n} must={p.mustSee} />}
      endContent={
        <VStack gap={0} align="end">
          <Text type="label" weight="semibold" hasTabularNumbers>{fmtDist(leg.distM)}</Text>
          <Text type="supporting">{MODE_LABEL[leg.mode]} {fmtMin(leg.totalMin)}</Text>
        </VStack>
      }
      isSelected={isSelected}
      onClick={onSelect}
    />
  );
}

/** Plain-language "how to get there" for one pandal. */
function howTo(leg: Leg, from: Pt & { label?: string }) {
  const p = leg.to;
  const drop = leg.restricted ? p.vehicleDrop.label : p.locality;
  if (leg.mode === "walk") return `Walk ${fmtDist(leg.distM)} from ${from.label ?? "here"}.`;
  if (leg.mode === "metro") return leg.steps.slice(0, 2).join(". ") + ".";
  if (leg.mode === "bus") return `Bus from the main road${p.buses?.length ? ` (${p.buses.join(", ")})` : ""}, get off near ${drop}.`;
  if (leg.mode === "auto") return `Shared auto ${p.autoStand ? `towards ${p.autoStand}` : `towards ${p.locality}`}, get down at ${drop}.`;
  return `Book a cab or bike to ${drop}.`;
}

function RouteCard({ p, leg, n, onDetail }: { p: Pandal; leg: Leg; n: number; onDetail: () => void }) {
  const ride = leg.mode !== "walk" && leg.mode !== "metro";
  const ModeIcon = MODE_ICON[leg.mode];
  return (
    <Card variant="muted" padding={4}>
      <VStack gap={4}>
        <HStack gap={3} align="center">
          <Num n={n} must={p.mustSee} />
          <VStack gap={0}>
            <Heading level={3} maxLines={1}>{p.name}</Heading>
            <Text type="supporting" maxLines={1}>{p.locality}</Text>
          </VStack>
        </HStack>
        <HStack gap={2} align="start">
          <Icon icon={ModeIcon} color="accent" />
          <VStack gap={1}>
            <Text>{howTo(leg, leg.from)}</Text>
            <Text type="supporting">{MODE_LABEL[leg.mode]} · {fmtDist(leg.distM)} · about {fmtMin(leg.totalMin)}</Text>
            {leg.restricted && ride && (
              <HStack gap={1} align="center">
                <Icon icon="warning" color="warning" size="sm" />
                <Text type="supporting">After 3 pm vehicles stop at {p.vehicleDrop.label}; walk the last {fmtDist(p.vehicleDrop.walkM)}.</Text>
              </HStack>
            )}
          </VStack>
        </HStack>
        <HStack gap={2} wrap="wrap">
          <Button label="Directions" variant="primary" size="sm" href={gmapsLink(leg.from, p, leg.mode)} target="_blank" />
          {(ride || leg.mode === "metro") && (
            <>
              <Button label="Uber" size="sm" href={uberLink(leg.from, p, p.vehicleDrop.label)} target="_blank" />
              <Button label="Ola" size="sm" href={olaLink(leg.from, p)} target="_blank" />
              <Button label="Rapido" size="sm" href={RAPIDO_LINK} target="_blank" />
            </>
          )}
          <Button label="About" variant="ghost" size="sm" onClick={onDetail} endContent={<Icon icon="chevronRight" />} />
        </HStack>
      </VStack>
    </Card>
  );
}

function crowdLabel(n: number) {
  return ["", "Light", "Moderate", "Busy", "Very busy", "Packed"][n] ?? "Busy";
}

function Detail({ p, slot, start, leg, onBack }: { p: Pandal; slot: Slot; start: Start | null; leg?: Leg; onBack: () => void }) {
  return (
    <VStack gap={4}>
      <HStack>
        <Button label="Back" variant="ghost" size="sm" icon={<Icon icon="chevronLeft" />} onClick={onBack} />
      </HStack>
      <VStack gap={1}>
        {p.nameBn && <Heading level={2} type="bangla">{p.nameBn}</Heading>}
        <Heading level={2}>{p.name}</Heading>
        <Text type="supporting">{p.locality}{start ? ` · ${fmtDist(dist(start, p))} from ${start.label}` : ""}</Text>
      </VStack>
      <MetadataList columns="multi">
        <MetadataListItem label="Crowd">{crowdLabel(p.crowd)}</MetadataListItem>
        <MetadataListItem label="Time inside">~{dwellFor(p, slot)} min</MetadataListItem>
        <MetadataListItem label="Best time">{p.bestTime}</MetadataListItem>
        {p.metro && <MetadataListItem label="Metro">{p.metro.station}, {p.metro.walkMin} min walk</MetadataListItem>}
        {!p.metro && p.rail && <MetadataListItem label="Rail">{p.rail}</MetadataListItem>}
        <MetadataListItem label="Cabs & autos reach">{p.vehicleDrop.label}, then {fmtDist(p.vehicleDrop.walkM)} on foot after 3 pm</MetadataListItem>
        {p.autoStand && <MetadataListItem label="Auto stand">{p.autoStand}</MetadataListItem>}
        {p.buses && <MetadataListItem label="Buses">{p.buses.join(", ")}</MetadataListItem>}
      </MetadataList>
      {p.note && <Banner status="info" title={p.note} collapsible={false} />}
      {leg && (
        <List header={<Heading level={4}>Getting there from {start?.label}</Heading>} listStyle="decimal" density="compact">
          {leg.steps.map((s, i) => <ListItem key={i} label={s} />)}
        </List>
      )}
      <HStack>
        <Button label="Open in Google Maps" variant="primary"
          href={start ? gmapsLink(start, p, leg?.mode ?? "walk") : `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
          target="_blank" />
      </HStack>
    </VStack>
  );
}

function Roads({ onBack }: { onBack: () => void }) {
  return (
    <VStack gap={4}>
      <HStack>
        <Button label="Back" variant="ghost" size="sm" icon={<Icon icon="chevronLeft" />} onClick={onBack} />
      </HStack>
      <VStack gap={1}>
        <Heading level={2}>Road closures</Heading>
        <Text type="supporting">Police can divert vehicles and rope off lanes at any time. Red circles on the map show where you&apos;ll likely finish on foot.</Text>
      </VStack>
      <List hasDividers>
        {ADVISORIES.map((a) => (
          <ListItem key={a.id} label={a.title}
            description={
              <VStack gap={1}>
                <Text type="supporting" color="accent">{a.when}{a.status === "pattern-2025" ? " · based on last year's plan" : ""}</Text>
                <Text>{a.body}</Text>
                <Link href={a.source.url} isExternalLink>{a.source.label}</Link>
              </VStack>
            } />
        ))}
        <ListItem label="Changes on the day"
          description={
            <VStack gap={1}>
              <Text>Check Kolkata Police&apos;s social handles before heading out.</Text>
              <Link href="https://kolkatapolice.gov.in/" isExternalLink>Kolkata Police</Link>
            </VStack>
          } />
      </List>
    </VStack>
  );
}
