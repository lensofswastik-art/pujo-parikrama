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
| Curated pandals with 2026 themes, metro / drop points, crowd | `src/data/pandals.ts` |
| Wider directory (~195 more pujos, pins from thepujo.com) | `src/data/more-pandals.ts` |
| Ready parikramas, start points, police advisories, no-vehicle zones | `src/data/parikramas.ts` |
| Route optimiser (nearest-neighbour + 2-opt), time-budget fitting, per-leg mode logic, ride deep links | `src/lib/planner.ts` |
| Street geometry for the map (OSRM, foot/car) | `src/lib/geometry.ts` |
| UI (Astryx components) | `src/components/*` |
| Design system theme (Astryx `defineTheme`) | `src/theme/pujoTheme.ts` → built `pujo.css` / `pujo.js` |

- **Start** — one search bar with Metro / Area capsules (`METRO_STATIONS`, `LOCALITIES` in `parikramas.ts`). Picking one lists pandals within ~3 km walking distance, nearest first, plus must-sees up to ~8 km (`NEARBY_M` / `ATTRACTION_M` in `Planner.tsx`).
- **Nearest, not a loop** — each pandal is routed directly from your starting point; tapping a row draws that one route and shows how to get there (walk, metro, auto, bus or cab) with Uber, Ola and Rapido buttons.
- **Evening restrictions** — read from the clock: after 3 pm the no-vehicle bubbles apply, so cab/auto/bus suggestions end at the pandal's `vehicleDrop` road and add the walk.
- **Rides** — Uber and Ola links pre-fill pickup + drop. Rapido has no public web deep link, so it opens the app/site. "Live directions" opens Google Maps for live traffic.

## Design system

The UI is built on [Astryx](https://astryx.atmeta.com) (Meta's open-source design system, `@astryxdesign/core` 0.7, public beta). Rules for agents and contributors are in `AGENTS.md`.

- Theme "Pujo Night": `src/theme/pujoTheme.ts` extends Astryx Neutral — marigold accent with ink labels, near-black surfaces, dusk-blue secondary and focus ring, alert red only for closures and walking routes; every text/surface pair measured against WCAG AA (body text ≥ 13:1, secondary ≥ 7.2:1). Soft shadows, concentric radii (32 → 16 → pill), Instrument Sans + Noto Sans Bengali. After editing run `npx astryx theme build src/theme/pujoTheme.ts`.
- `globals.css` only positions the app frame and map markers, using Astryx tokens.
- Map settings (gear button) switch the basemap between OpenFreeMap Liberty (light) and Dark; the choice is remembered per browser.

## Before go-live — please verify

1. **Pins** — most pins come from thepujo.com's directory (`pin: "verified"`). Nine Dum Dum / Baranagar / Kestopur pujos are placed by locality (`pin: "approx"`) — correct them in `more-pandals.ts`.
2. **Themes** — `theme: null` shows "yet to be revealed" (College Square was reported by some outlets, Md Ali Park, Chetla Agrani, Salt Lake blocks etc. not yet confirmed at build time).
3. **No-vehicle zones** — centres and radii in `NO_VEHICLE_ZONES` are estimates around clusters, not police-drawn boundaries. Update from the Kolkata Police order / on-ground reports.
4. **Routing server** — `routing.openstreetmap.de` is a free community server with fair-use limits. If traffic is high on Ashtami, self-host OSRM or swap in a keyed router (Mapbox/GraphHopper) in `geometry.ts`. The app falls back to straight lines if it's unavailable.
5. **Map** — MapLibre GL with the free, keyless OpenFreeMap "liberty" style (OpenStreetMap data). Change `MAP_STYLE` in `MapView.tsx` to `.../styles/bright` or `.../styles/positron` for a different look. Google Maps would need an API key with billing enabled.

## Data sources (Sept–Oct 2026)

- Themes: KolkataKhoj (17 Sept), District, IndianEagle, myaaspaas
- Pandal list and pins: thepujo.com directory (306 pujos, Oct 2026); Dum Dum / Baranagar additions from pujor_satkahon's 2026 guide and KolkataKhoj
- Traffic: Telegraph (via Modernforce, 8 Oct), NativePlanet, KTV Bangla; one-way patterns from the 2025 order (Bengal Info)
- Dates (Kolkata, Drik Panchang): Shashthi 17 Oct · Saptami 18 · Ashtami 19 · Navami 20 · Dashami 21
