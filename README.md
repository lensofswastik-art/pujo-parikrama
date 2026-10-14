# পুজো পরিক্রমা · Pujo Parikrama 2026

Kolkata Durga Puja pandal-hopping planner. Pick where you're setting out from and what you want to see — a ready parikrama, a whole area, or one pandal — and it builds the fastest order, fits it to the hours you have, and tells you how to get between each stop on foot, by metro, auto, bus or cab, accounting for evening no-entry grids.

## Run & deploy

```bash
npm install
npm run dev        # http://localhost:3000
```

**Vercel:** push this folder to GitHub → "Add New Project" on Vercel → import → Deploy. No environment variables needed. Framework preset: Next.js.

## How it works

| Piece | File |
|---|---|
| Pandals, 2026 themes, metro / drop points, crowd | `src/data/pandals.ts` |
| Ready parikramas, start points, police advisories, no-vehicle zones | `src/data/parikramas.ts` |
| Route optimiser (nearest-neighbour + 2-opt), time-budget fitting, per-leg mode logic, ride deep links | `src/lib/planner.ts` |
| Street geometry for the map (OSRM, foot/car) | `src/lib/geometry.ts` |
| UI | `src/components/*` |

- **Start** — one search bar plus area capsules. Picking an area shows pandals within 2.5 km plus must-sees within 8 km, and plans the best order (constants `NEARBY_M` / `ATTRACTION_M` in `Planner.tsx`). Each ride leg suggests where to board an auto or bus and links to Uber, Ola and Rapido.
- **Time budget** — picks must-sees first, then cheapest insertion until the hours run out. What doesn't fit is listed under "Didn't fit" with one-tap add.
- **Evening restrictions** — choosing *Evening* or *After midnight* switches on the no-vehicle bubbles: cab/auto/bus legs end at the pandal's `vehicleDrop` road and add the walk.
- **Rides** — Uber and Ola links pre-fill pickup + drop. Rapido has no public web deep link, so it opens the app/site. "Live directions" opens Google Maps for live traffic.

## Before go-live — please verify

1. **Pins** — every pandal is marked `pin: "approx"`. Open each in Google Maps and correct lat/lng (Tala Prattoy moved to a new site this year).
2. **Themes** — `theme: null` shows "yet to be revealed" (College Square was reported by some outlets, Md Ali Park, Chetla Agrani, Salt Lake blocks etc. not yet confirmed at build time).
3. **No-vehicle zones** — centres and radii in `NO_VEHICLE_ZONES` are estimates around clusters, not police-drawn boundaries. Update from the Kolkata Police order / on-ground reports.
4. **Routing server** — `routing.openstreetmap.de` is a free community server with fair-use limits. If traffic is high on Ashtami, self-host OSRM or swap in a keyed router (Mapbox/GraphHopper) in `geometry.ts`. The app falls back to straight lines if it's unavailable.
5. **Map** — MapLibre GL with the free, keyless OpenFreeMap "liberty" style (OpenStreetMap data). Change `MAP_STYLE` in `MapView.tsx` to `.../styles/bright` or `.../styles/positron` for a different look. Google Maps would need an API key with billing enabled.

## Data sources (Sept–Oct 2026)

- Themes: KolkataKhoj (17 Sept), District, IndianEagle, myaaspaas
- Traffic: Telegraph (via Modernforce, 8 Oct), NativePlanet, KTV Bangla; one-way patterns from the 2025 order (Bengal Info)
- Dates (Kolkata, Drik Panchang): Shashthi 17 Oct · Saptami 18 · Ashtami 19 · Navami 20 · Dashami 21
