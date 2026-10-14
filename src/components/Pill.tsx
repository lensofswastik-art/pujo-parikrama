"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IChevron } from "./Icons";

interface Props<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  icon?: ReactNode;
}

/** One compact setting: shows the current choice, opens a short list on tap. */
export default function Pill<T extends string | number>({ label, value, options, onChange, icon }: Props<T>) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className="pill" ref={root}>
      <button type="button" className="pill-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current?.label}`}
        onClick={() => setOpen((o) => !o)}>
        {current?.icon ?? icon}
        <span>{current?.label}</span>
        <IChevron width={14} />
      </button>
      {open && (
        <div className="pill-menu" role="listbox" aria-label={label}>
          <div className="pill-menu-title">{label}</div>
          {options.map((o) => (
            <button key={String(o.value)} type="button" role="option" aria-selected={o.value === value} className="pill-opt"
              onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.icon}
              <span>
                {o.label}
                {o.hint && <small>{o.hint}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
