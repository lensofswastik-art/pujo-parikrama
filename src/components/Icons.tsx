import type { SVGProps } from "react";

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;
type P = SVGProps<SVGSVGElement>;

export const IWalk = (p: P) => (<svg {...base} {...p}><circle cx="13" cy="4" r="1.8" /><path d="M10 21l2-6 3 3v3M9 11l3-3 3 2 2 3M12 8l-1 6" /></svg>);
export const IAuto = (p: P) => (<svg {...base} {...p}><path d="M4 16V9a4 4 0 0 1 4-4h6l4 6v5" /><path d="M4 11h14M10 5v6" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>);
export const IBus = (p: P) => (<svg {...base} {...p}><rect x="4" y="3.5" width="16" height="14" rx="3" /><path d="M4 11h16M8 21v-3.5M16 21v-3.5" /><circle cx="8" cy="14.5" r=".8" fill="currentColor" /><circle cx="16" cy="14.5" r=".8" fill="currentColor" /></svg>);
export const ICab = (p: P) => (<svg {...base} {...p}><path d="M5 16v-4l2-5h10l2 5v4" /><path d="M3 12h18M9 4h6" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></svg>);
export const IMetro = (p: P) => (<svg {...base} {...p}><rect x="6" y="3" width="12" height="14" rx="3" /><path d="M6 10h12M8 21l2-4M16 21l-2-4" /><circle cx="9.5" cy="13.5" r=".8" fill="currentColor" /><circle cx="14.5" cy="13.5" r=".8" fill="currentColor" /></svg>);
export const ISpark = (p: P) => (<svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>);
export const ILocate = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>);
export const IBarricade = (p: P) => (<svg {...base} {...p}><rect x="3" y="7" width="18" height="6" rx="1" /><path d="M7 7l-3 6M12 7l-3 6M17 7l-3 6M21 9l-2 4M6 13v7M18 13v7" /></svg>);
export const IFit = (p: P) => (<svg {...base} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
export const IClose = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IBack = (p: P) => (<svg {...base} {...p}><path d="M15 5l-7 7 7 7" /></svg>);
export const IPlus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const IChevron = (p: P) => (<svg {...base} {...p}><path d="M7 10l5 5 5-5" /></svg>);

export const MODE_ICON = { walk: IWalk, auto: IAuto, bus: IBus, cab: ICab, metro: IMetro, smart: ISpark } as const;

/** Alpona lotus — drawn in rice-paste white dots and petals. Used as brand mark and empty state. */
export function Alpona({ size = 34, stroke = "#fffdf8", accent = "#e8a317" }: { size?: number; stroke?: string; accent?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  const dots = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {petals.map((a) => (
        <path key={a} transform={`rotate(${a} 32 32)`} d="M32 8c5 6 5 12 0 16c-5-4-5-10 0-16z" fill="none" stroke={stroke} strokeWidth="2.2" />
      ))}
      {dots.map((a) => (
        <circle key={a} transform={`rotate(${a} 32 32)`} cx="32" cy="3.5" r="1.6" fill={stroke} />
      ))}
      <circle cx="32" cy="32" r="6" fill={accent} />
      <circle cx="32" cy="32" r="2.4" fill={stroke} />
    </svg>
  );
}
