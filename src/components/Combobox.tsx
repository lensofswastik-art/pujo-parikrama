"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

export interface Option {
  key: string;
  group: string;
  label: string;
  sub?: string;
  bn?: string;
  icon?: ReactNode;
}

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  options: Option[];
  searchPlaceholder: string;
  onPick: (key: string) => void;
  pin: "from" | "to";
}

export default function Combobox({ label, value, placeholder, options, searchPlaceholder, onPick, pin }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => `${o.label} ${o.sub ?? ""} ${o.bn ?? ""}`.toLowerCase().includes(t));
  }, [q, options]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    input.current?.focus();
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (k: string) => { onPick(k); setOpen(false); setQ(""); };

  let lastGroup = "";
  return (
    <div className="cb" ref={root}>
      <i className={`od-pin ${pin}`} aria-hidden="true" />
      <button type="button" className="cb-field" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="cb-text">
          <span className="cb-label">{label}</span>
          <span className={`cb-value${value ? "" : " empty"}`}>{value ?? placeholder}</span>
        </span>
      </button>
      {open && (
        <div className="cb-pop">
          <div className="cb-search">
            <input
              ref={input} value={q} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
              role="combobox" aria-expanded aria-controls={listId}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter" && filtered[active]) choose(filtered[active].key);
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
          <div role="listbox" id={listId}>
            {filtered.length === 0 && <div className="cb-empty">Nothing matches “{q}”. Try a locality like Gariahat or Tala.</div>}
            {filtered.map((o, i) => {
              const head = o.group !== lastGroup ? <div className="cb-group">{o.group}</div> : null;
              lastGroup = o.group;
              return (
                <div key={o.key}>
                  {head}
                  <button type="button" role="option" aria-selected={i === active} data-active={i === active}
                    className="cb-opt" onClick={() => choose(o.key)} onMouseEnter={() => setActive(i)}>
                    {o.icon && <span className="ico">{o.icon}</span>}
                    <span>{o.label}{o.sub && <small>{o.sub}</small>}</span>
                    {o.bn && <span className="bn">{o.bn}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
