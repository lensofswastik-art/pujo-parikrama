"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, LOCALITIES, METRO_STATIONS, type Area } from "@/data/parikramas";
import { PANDALS } from "@/data/pandals";
import { Alpona, IClose, ILocate, IMetro } from "./Icons";

export type Pick =
  | { kind: "area"; area: Area }
  | { kind: "pandal"; id: string }
  | { kind: "here" };

interface Props {
  value: string | null;
  activeAreaId: string | null;
  onPick: (p: Pick) => void;
  onClear: () => void;
}

/** One input: type a station, area or pandal — or tap a capsule. */
export default function SearchBar({ value, activeAreaId, onPick, onClear }: Props) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [cat, setCat] = useState<"metro" | "area">("metro");
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const a = AREAS.find((x) => x.id === activeAreaId);
    if (a) setCat(a.kind);
  }, [activeAreaId]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const match = (a: Area) => !t || `${a.label} ${a.bn}`.toLowerCase().includes(t);
    const areas = [...METRO_STATIONS.filter(match), ...LOCALITIES.filter(match)]
      .map((a) => ({ key: a.id, label: a.label, sub: a.kind === "metro" ? "Metro station" : "Area", bn: a.bn, metro: a.kind === "metro", pick: { kind: "area", area: a } as Pick }));
    const pandals = t
      ? PANDALS.filter((p) => `${p.name} ${p.nameBn} ${p.locality} ${p.theme ?? ""}`.toLowerCase().includes(t))
          .map((p) => ({ key: `p:${p.id}`, label: p.name, sub: p.locality, bn: p.nameBn, metro: false, pick: { kind: "pandal", id: p.id } as Pick }))
      : [];
    return [
      { key: "here", label: "Use my current location", sub: "", bn: "", metro: false, pick: { kind: "here" } as Pick },
      ...(t ? [...areas, ...pandals] : areas.filter((a) => a.metro === (cat === "metro"))),
    ].slice(0, 40);
  }, [q, cat]);

  useEffect(() => {
    if (!focused) return;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setFocused(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [focused]);

  const choose = (p: Pick) => { onPick(p); setQ(""); setFocused(false); input.current?.blur(); };
  const list = cat === "metro" ? METRO_STATIONS : LOCALITIES;

  return (
    <div className="search" ref={root}>
      <div className="search-bar">
        <span className="search-mark"><Alpona size={26} /></span>
        <input
          ref={input}
          className="search-input"
          value={focused ? q : value ?? ""}
          placeholder="Nearest metro or your area"
          aria-label="Search a metro station, area or pandal"
          role="combobox"
          aria-expanded={focused}
          aria-controls="search-results"
          onFocus={() => { setFocused(true); setQ(""); setActive(0); }}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && results[active]) choose(results[active].pick);
            if (e.key === "Escape") { setFocused(false); input.current?.blur(); }
          }}
        />
        {value && !focused ? (
          <button className="search-btn" onClick={onClear} aria-label="Clear starting point"><IClose width={18} /></button>
        ) : (
          <button className="search-btn" onClick={() => choose({ kind: "here" })} aria-label="Use my current location"><ILocate width={19} /></button>
        )}
      </div>

      {focused ? (
        <ul className="search-results" id="search-results" role="listbox">
          {results.map((r, i) => (
            <li key={r.key}>
              <button role="option" aria-selected={i === active} data-active={i === active} className="sr-opt"
                onMouseEnter={() => setActive(i)} onClick={() => choose(r.pick)}>
                {r.key === "here" ? <ILocate width={17} /> : r.metro ? <IMetro width={17} /> : <span className={`sr-dot ${r.sub === "Area" ? "area" : ""}`} />}
                <span className="sr-text">{r.label}{r.sub && <small>{r.sub}</small>}</span>
                {r.bn && <span className="sr-bn">{r.bn}</span>}
              </button>
            </li>
          ))}
          {results.length === 1 && <li className="sr-empty">No station, area or pandal matches “{q}”.</li>}
        </ul>
      ) : (
        <div className="picker">
          <div className="cat" role="tablist" aria-label="Start from">
            <button role="tab" aria-selected={cat === "metro"} onClick={() => setCat("metro")}><IMetro width={15} />Metro</button>
            <button role="tab" aria-selected={cat === "area"} onClick={() => setCat("area")}>Area</button>
          </div>
          <div className="capsules" role="group" aria-label={cat === "metro" ? "Metro stations" : "Areas"}>
            {list.map((a) => (
              <button key={a.id} className="capsule" aria-pressed={activeAreaId === a.id} onClick={() => choose({ kind: "area", area: a })}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
