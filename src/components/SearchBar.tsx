"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, type Area } from "@/data/parikramas";
import { PANDALS } from "@/data/pandals";
import { Alpona, IClose, ILocate } from "./Icons";

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

/** One input: type an area or pandal, or tap a capsule. */
export default function SearchBar({ value, activeAreaId, onPick, onClear }: Props) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const areas = AREAS.filter((a) => !t || `${a.label} ${a.bn}`.toLowerCase().includes(t))
      .map((a) => ({ key: `a:${a.id}`, label: a.label, sub: "Area", bn: a.bn, pick: { kind: "area", area: a } as Pick }));
    const pandals = t
      ? PANDALS.filter((p) => `${p.name} ${p.nameBn} ${p.locality} ${p.theme ?? ""}`.toLowerCase().includes(t))
          .map((p) => ({ key: `p:${p.id}`, label: p.name, sub: p.locality, bn: p.nameBn, pick: { kind: "pandal", id: p.id } as Pick }))
      : [];
    return [{ key: "here", label: "Use my current location", sub: "", bn: "", pick: { kind: "here" } as Pick }, ...areas, ...pandals].slice(0, 30);
  }, [q]);

  useEffect(() => {
    if (!focused) return;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setFocused(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [focused]);

  const choose = (p: Pick) => { onPick(p); setQ(""); setFocused(false); input.current?.blur(); };

  return (
    <div className="search" ref={root}>
      <div className="search-bar">
        <span className="search-mark"><Alpona size={26} /></span>
        <input
          ref={input}
          className="search-input"
          value={focused ? q : value ?? ""}
          placeholder="Where are you starting from?"
          aria-label="Search an area or pandal"
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
                {r.key === "here" ? <ILocate width={17} /> : <span className={`sr-dot ${r.sub === "Area" ? "area" : ""}`} />}
                <span className="sr-text">{r.label}{r.sub && r.sub !== "Area" && <small>{r.sub}</small>}</span>
                {r.bn && <span className="sr-bn">{r.bn}</span>}
              </button>
            </li>
          ))}
          {results.length === 1 && <li className="sr-empty">No area or pandal matches “{q}”.</li>}
        </ul>
      ) : (
        <div className="capsules" role="group" aria-label="Popular areas">
          {AREAS.filter((a) => a.capsule).map((a) => (
            <button key={a.id} className="capsule" aria-pressed={activeAreaId === a.id} onClick={() => choose({ kind: "area", area: a })}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
