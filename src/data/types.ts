export type Zone = "north" | "central" | "south" | "saltlake" | "dumdum" | "east";

export type Crowd = 1 | 2 | 3 | 4 | 5; // 5 = Sreebhumi-level queues

export interface Pandal {
  id: string;
  name: string;
  nameBn: string;
  zone: Zone;
  locality: string;
  lat: number;
  lng: number;
  /** 2026 theme; null = committee hasn't revealed it yet */
  theme: string | null;
  themeMeaning?: string;
  note?: string;
  kind: "theme" | "sabeki" | "art" | "replica" | "bonedi";
  mustSee?: boolean;
  crowd: Crowd;
  /** Typical dwell incl. queue at peak, minutes */
  dwell: number;
  bestTime: string;
  metro?: { station: string; walkMin: number };
  rail?: string;
  /** Nearest point a cab / auto can usually reach during evening restrictions */
  vehicleDrop: { label: string; walkM: number };
  autoStand?: string;
  buses?: string[];
  /** How sure we are of the pin itself */
  pin: "verified" | "approx";
}

export interface Parikrama {
  id: string;
  title: string;
  titleBn: string;
  blurb: string;
  zone: Zone;
  stops: string[]; // pandal ids in suggested order
  start: { label: string; lat: number; lng: number; metro?: { station: string; walkMin: number } };
  bestMode: Mode;
  hours: string;
}

export type Mode = "smart" | "walk" | "auto" | "bus" | "cab" | "metro";

export interface Advisory {
  id: string;
  title: string;
  body: string;
  when: string;
  source: { label: string; url: string };
  status: "confirmed-2026" | "pattern-2025";
}

export interface NoVehicleZone {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radiusM: number;
  hours: string;
  roads: string[];
}
